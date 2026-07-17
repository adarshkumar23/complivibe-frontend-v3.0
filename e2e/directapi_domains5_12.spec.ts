import { test, expect } from "playwright/test";
import { BASE_API } from "./routes";
import { apiLogin, emailForPersona, type Session } from "./apihelpers";

// Direct-API RBAC matrix for domains 5-12 (the "unauthorized 403" + "authorized
// real mutation" halves). Runs as one scenarios test that logs in every persona
// and loops all create/mutate endpoints, so it also does the shared FK setup
// (a policy for attestation/exception) once.
//
// Permission enforcement is a route dependency that fires BEFORE body validation
// (verified: a non-writer POSTing an empty body gets 403, not 422), so the
// non-writer 403 assertion holds regardless of payload. Writers send fully valid
// payloads and get a real 2xx. Role sets are cross-referenced against the live
// 0307 catalog (incl. the reviewer de-scope and the CM KRI/appetite grant).

const ALL = ["admin", "compliance_manager", "reviewer_unassigned", "reviewer_assigned", "auditor", "readonly"];
const W = ["admin", "compliance_manager"]; // the common writer set
const WR = [...W, "reviewer_unassigned", "reviewer_assigned"]; // + reviewer (reports:generate, exports:run)
const WA = [...W, "auditor"]; // + auditor (exports:verify)

test("directapi 5-12: create/mutate RBAC per role (403 for non-writers, 2xx for writers)", async ({ request }, testInfo) => {
  const S: Record<string, Session> = {};
  for (const p of ALL) S[p] = await apiLogin(request, emailForPersona(p));
  const admin = S["admin"];
  const R = `${testInfo.workerIndex}-${Date.now()}`;

  // Shared FK: a policy for attestation-campaign + policy-exception.
  const jok = async (r: import("playwright/test").APIResponse) => { expect(r.ok(), `setup ${r.url()} -> ${r.status()} ${await r.text()}`).toBeTruthy(); return r.json(); };
  const policy = await jok(await request.post(`${BASE_API}/api/v1/compliance/policies`, { headers: admin.headers, data: { title: `PartD FK Policy ${R}`, policy_type: "acceptable_use", owner_user_id: admin.uid } }));

  // Each entry: which roles are ALLOWED, and the create payload (unique per persona
  // via `u` so multiple writers in the loop never collide on a unique field).
  // writer2xx=false where the endpoint is a singleton (a 2nd/ repeat create is a
  // legitimate non-permission 4xx) -- there we only assert the writer is not 403.
  type Ep = { key: string; path: string; allowed: string[]; writer2xx?: boolean; body: (s: Session, u: string) => Record<string, unknown> };
  const EPS: Ep[] = [
    { key: "evidence:write (create)", path: "/api/v1/evidence", allowed: W, body: (_s, u) => ({ title: `PartD ev ${u}`, evidence_type: "document" }) },
    { key: "evidence_automation_rules:write", path: "/api/v1/evidence-automation/rules", allowed: W, body: () => ({ trigger_source: "webhook", evidence_type: "other" }) },
    { key: "tasks:write", path: "/api/v1/tasks", allowed: W, body: (_s, u) => ({ title: `PartD task ${u}`, task_type: "general" }) },
    { key: "risk_indicators:write (KRI, 0307 CM grant)", path: "/api/v1/compliance/risk-indicators", allowed: W, body: (s, u) => ({ name: `PartD KRI ${u}`, metric_type: "custom", target_value: 50, warning_threshold: 60, critical_threshold: 80, owner_user_id: s.uid }) },
    // risk_appetite is an org singleton per (scope, category): a repeat create is a
    // 422 "already exists", not a permission failure -- so assert only "not 403".
    { key: "risk_appetite:write (0307 CM grant)", path: "/api/v1/compliance/risk-appetite", allowed: W, writer2xx: false, body: (s) => ({ scope_type: "org", risk_category: "operational", max_acceptable_score: 10, escalation_owner_id: s.uid }) },
    { key: "ai_systems:write (register)", path: "/api/v1/ai-systems", allowed: W, body: (_s, u) => ({ name: `PartD AIS ${u}`, system_type: "internal_model" }) },
    { key: "ai_systems:write (autopilot policy)", path: "/api/v1/ai-governance/autopilot/policies", allowed: W, body: (_s, u) => ({ name: `PartD AP ${u}` }) },
    { key: "audit:write (engagement)", path: "/api/v1/compliance/audit-engagements", allowed: W, body: (_s, u) => ({ title: `PartD Eng ${u}`, audit_type: "internal_readiness", start_date: "2027-01-01", end_date: "2027-02-01" }) },
    { key: "compliance_policies:write (attestation campaign)", path: "/api/v1/compliance/attestation-campaigns", allowed: W, body: (s, u) => ({ name: `PartD Camp ${u}`, title: `PartD Camp ${u}`, policy_id: policy.id, policy_version: "1.0", due_date: "2027-01-01", user_ids: [s.uid] }) },
    { key: "compliance_policies:write (policy exception)", path: "/api/v1/compliance/policy-exceptions", allowed: W, body: (_s, u) => ({ policy_id: policy.id, title: `PartD Exc ${u}`, description: "d", justification: "j", reason: "r", requested_expiry_date: "2027-01-01" }) },
    { key: "exports:write (create job)", path: "/api/v1/exports/jobs", allowed: W, body: (_s, u) => ({ export_type: "executive_summary_json", title: `PartD Exp ${u}` }) },
    { key: "reports:generate (+reviewer)", path: "/api/v1/reports/generate", allowed: WR, body: () => ({ report_type: "executive_summary", dry_run: true }) },
  ];

  const results: Record<string, Record<string, number>> = {};
  for (const ep of EPS) {
    results[ep.key] = {};
    for (const p of ALL) {
      const res = await request.post(`${BASE_API}${ep.path}`, { headers: S[p].headers, data: ep.body(S[p], `${R}-${p}`) });
      results[ep.key][p] = res.status();
      if (ep.allowed.includes(p)) {
        expect(res.status(), `${p} (allowed) should NOT be 403 on ${ep.key}, got ${res.status()}`).not.toBe(403);
        if (ep.writer2xx !== false) expect(res.status(), `${p} (allowed) should get 2xx on ${ep.key}, got ${res.status()}`).toBeLessThan(300);
      } else {
        expect(res.status(), `${p} (denied) must be 403 on ${ep.key}, got ${res.status()}`).toBe(403);
      }
    }
  }

  // Evidence FILE UPLOAD (R2): evidence:write. R2 is unconfigured in the test env,
  // so a writer gets 503 (storage down) -- the permission gate still runs first,
  // so the meaningful RBAC signal is: non-writer 403, writer NOT 403.
  const ev = await jok(await request.post(`${BASE_API}/api/v1/evidence`, { headers: admin.headers, data: { title: `PartD upload ev ${R}`, evidence_type: "document" } }));
  const upload: Record<string, number> = {};
  for (const p of ALL) {
    const res = await request.post(`${BASE_API}/api/v1/evidence/${ev.id}/file`, {
      headers: { Authorization: S[p].headers.Authorization, "X-Organization-ID": S[p].headers["X-Organization-ID"] },
      multipart: { file: { name: "e.txt", mimeType: "text/plain", buffer: Buffer.from("partd evidence bytes") } },
    });
    upload[p] = res.status();
    if (W.includes(p)) expect(res.status(), `${p} (writer) upload must not be 403, got ${res.status()}`).not.toBe(403);
    else expect(res.status(), `${p} (non-writer) upload must be 403, got ${res.status()}`).toBe(403);
  }
  results["evidence:write (file upload, R2)"] = upload;

  // Exports run (+reviewer) and verify (+auditor) on a real job -- exercises the
  // reviewer/auditor grants and the "signed export verify" path.
  const job = await jok(await request.post(`${BASE_API}/api/v1/exports/jobs`, { headers: admin.headers, data: { export_type: "executive_summary_json" } }));
  for (const [action, allowed] of [["run", WR], ["verify", WA]] as const) {
    results[`exports:${action}`] = {};
    for (const p of ALL) {
      const res = await request.post(`${BASE_API}/api/v1/exports/jobs/${job.id}/${action}`, { headers: S[p].headers, data: {} });
      results[`exports:${action}`][p] = res.status();
      if (allowed.includes(p)) expect(res.status(), `${p} (allowed) ${action} must not be 403, got ${res.status()}`).not.toBe(403);
      else expect(res.status(), `${p} (denied) ${action} must be 403, got ${res.status()}`).toBe(403);
    }
  }

  await testInfo.attach("directapi-5-12", { body: JSON.stringify(results, null, 2), contentType: "application/json" });
  console.log("DIRECTAPI 5-12:\n" + JSON.stringify(results, null, 2));
});
