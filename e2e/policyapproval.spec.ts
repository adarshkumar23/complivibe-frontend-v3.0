import { test, expect } from "playwright/test";
import { BASE_API } from "./routes";
import { apiLogin } from "./apihelpers";

// SAFETY-CRITICAL: the policy approval-quorum path. Authority to approve a
// specific request is granted by EITHER (a) instance-level assignment -- the
// caller IS the named approver, even if their role lacks the blanket
// compliance_policies:approve permission (a de-scoped reviewer assigned to a
// request can act on THAT request) -- OR (b) a blanket approve grant
// (admin/compliance_manager). A self-approval guard also blocks the requester
// from approving their own request even if they hold the blanket grant.
//
// The whole matrix is exercised against ONE freshly-built request (admin creates
// policy -> version -> submit -> approval-request assigned to reviewer_assigned),
// so the spec is idempotent across re-runs and never depends on seed state. The
// negative attempts (which do NOT consume the request) run first; the assigned
// reviewer's successful approval (which consumes it) runs last.
test("policy approval quorum: assigned reviewer approves; unassigned/self are blocked", async ({ request }, testInfo) => {
  const admin = await apiLogin(request, "partd-admin@example.com");
  const revAssigned = await apiLogin(request, "partd-rev-assigned@example.com");
  const revUnassigned = await apiLogin(request, "partd-rev-unassigned@example.com");
  const auditor = await apiLogin(request, "partd-auditor@example.com");

  const P = `${BASE_API}/api/v1/compliance/policies`;
  const j = async (r: import("playwright/test").APIResponse) => {
    expect(r.ok(), `setup step failed: ${r.status()} ${await r.text()}`).toBeTruthy();
    return r.json();
  };

  // Build a fresh approval request assigned to the (de-scoped) assigned reviewer.
  const policy = await j(await request.post(P, { headers: admin.headers, data: { title: `PartD Approval Matrix ${Date.now()}`, policy_type: "acceptable_use", owner_user_id: admin.uid } }));
  const version = await j(await request.post(`${P}/${policy.id}/versions`, { headers: admin.headers, data: { version_number: "1.0", content_snapshot_json: { rev: 1 }, change_summary: "v1" } }));
  await j(await request.post(`${P}/${policy.id}/versions/${version.id}/submit-for-approval`, { headers: admin.headers, data: { notes: "submit" } }));
  const req = await j(await request.post(`${P}/${policy.id}/approval-requests`, { headers: admin.headers, data: { version_id: version.id, approver_user_id: revAssigned.uid, notes: "assigned to partd reviewer" } }));

  const approve = (s: { headers: Record<string, string> }) =>
    request.post(`${P}/${policy.id}/approval-requests/${req.id}/approve`, { headers: s.headers, data: { review_notes: "e2e" } });

  // Negative cases first -- none of these consume the pending request.
  const rUnassigned = await approve(revUnassigned); // not assigned, no blanket grant (reviewer de-scoped)
  const rAuditor = await approve(auditor);          // no blanket grant, not assigned
  const rSelf = await approve(admin);               // holds blanket grant BUT is the requester -> self-approval guard

  expect(rUnassigned.status(), "unassigned reviewer must be 403").toBe(403);
  expect(rAuditor.status(), "auditor must be 403").toBe(403);
  expect(rSelf.status(), "requester self-approval must be 400").toBe(400);

  // Positive case -- the assigned reviewer CAN approve via the instance path.
  const rAssigned = await approve(revAssigned);
  expect(rAssigned.status(), "assigned reviewer must be able to approve (instance-level authority)").toBe(200);

  // The request is now consumed; a second approval must fail (not pending).
  const rReapprove = await approve(revAssigned);
  expect(rReapprove.status(), "re-approving a consumed request must be 400").toBe(400);

  const summary = {
    policy_id: policy.id, request_id: req.id,
    unassigned_reviewer: rUnassigned.status(), auditor: rAuditor.status(),
    requester_self_approve: rSelf.status(), assigned_reviewer: rAssigned.status(),
    reapprove_after_consumed: rReapprove.status(),
  };
  await testInfo.attach("policy-approval", { body: JSON.stringify(summary, null, 2), contentType: "application/json" });
  console.log("POLICY-APPROVAL MATRIX:", JSON.stringify(summary));
});
