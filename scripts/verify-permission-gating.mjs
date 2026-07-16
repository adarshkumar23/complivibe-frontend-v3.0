/**
 * Permission-gating regression harness.
 *
 * Verifies that permission-gated action buttons render ONLY for users the backend
 * would authorize — so the UI never offers an action that will 403 at submit time:
 *   - "New Risk" (risks:write): shown for admin/compliance_manager, hidden for reviewer.
 *   - Policy "Approve" (compliance_policies:approve OR assigned approver): shown for
 *     admin/manager and for the ASSIGNED reviewer; hidden for an unassigned reviewer.
 *
 * Config comes from env vars (no hardcoded paths) so it re-runs cleanly against any
 * seeded stack. Point it at a running FE whose backend has the users below seeded:
 *
 *   CV_BASE_URL                  FE base URL              (default http://127.0.0.1:3778)
 *   CV_PASSWORD                  password for all users   (default DemoPass2024!)
 *   CV_ADMIN_EMAIL               admin-role user          (default admin@uievidence.io)
 *   CV_MANAGER_EMAIL             compliance_manager user  (default manager@uievidence.io)
 *   CV_REVIEWER_EMAIL            reviewer, NOT an approver (default reviewer-unassigned@uievidence.io)
 *   CV_ASSIGNED_REVIEWER_EMAIL   reviewer who IS the approver on CV_POLICY_ID
 *                                                         (default reviewer-assigned@uievidence.io)
 *   CV_POLICY_ID                 a policy with a PENDING approval assigned to
 *                                CV_ASSIGNED_REVIEWER_EMAIL. If unset, the Approve
 *                                assertions are skipped and only New-Risk gating runs.
 *
 * Example:
 *   CV_BASE_URL=http://127.0.0.1:3778 CV_PASSWORD='UiEvid2026!x' \
 *   CV_POLICY_ID=<uuid> node scripts/verify-permission-gating.mjs
 *
 * Extending for a new permission (e.g. the tracked KRI/appetite gap — once a role
 * gains risk_indicators:write / risk_appetite:write and the FE gains a gated button):
 * add a check block modeled on the New-Risk one (navigate to the page, locate the
 * button, assert visibility per role) and a matching expectation on each CASE.
 */
import { chromium } from "playwright";

const BASE = (process.env.CV_BASE_URL || "http://127.0.0.1:3778").replace(/\/$/, "");
const PW = process.env.CV_PASSWORD || "DemoPass2024!";
const POLICY_ID = process.env.CV_POLICY_ID || "";
const EMAIL = {
  admin: process.env.CV_ADMIN_EMAIL || "admin@uievidence.io",
  manager: process.env.CV_MANAGER_EMAIL || "manager@uievidence.io",
  reviewerUnassigned: process.env.CV_REVIEWER_EMAIL || "reviewer-unassigned@uievidence.io",
  reviewerAssigned: process.env.CV_ASSIGNED_REVIEWER_EMAIL || "reviewer-assigned@uievidence.io"
};
const checkApprove = Boolean(POLICY_ID);

// role -> expected visibility of each gated action
const CASES = [
  { key: "admin", email: EMAIL.admin, newRisk: true, approve: true },
  { key: "compliance_manager", email: EMAIL.manager, newRisk: true, approve: true },
  { key: "reviewer-unassigned", email: EMAIL.reviewerUnassigned, newRisk: false, approve: false },
  { key: "reviewer-assigned", email: EMAIL.reviewerAssigned, newRisk: false, approve: true }
];

console.log(`Base: ${BASE}  |  Approve checks: ${checkApprove ? `on (policy ${POLICY_ID})` : "SKIPPED (set CV_POLICY_ID)"}`);

const results = [];
let failures = 0;

for (const c of CASES) {
  // Fresh browser per case: isolates dev-server load so the modal's own
  // useCurrentUser (/auth/me) query reliably resolves before we assert.
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 950 } });
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await page.waitForSelector('input[type="email"]', { timeout: 30000 });
    await page.waitForTimeout(1500); // let React hydrate so submit runs the JS handler (not a native GET)
    await page.fill('input[type="email"]', c.email);
    await page.fill('input[type="password"]', PW);
    await Promise.all([
      page.waitForURL("**/dashboard**", { timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);

    // ── Risk page: "New Risk" button (risks:write) ──
    await page.goto(`${BASE}/dashboard/risks`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("text=Risk Command Center", { timeout: 30000 });
    await page.waitForTimeout(1500); // let the permissions query settle
    const newRiskVisible = (await page.locator('button:has-text("New Risk")').count()) > 0;

    // ── Policy detail: "Approve" button (compliance_policies:approve OR assigned) ──
    let approveVisible = null;
    if (checkApprove) {
      await page.goto(`${BASE}/dashboard/policies`, { waitUntil: "networkidle" });
      await page.waitForSelector(`[data-testid="policy-row-${POLICY_ID}"]`, { timeout: 30000 });
      // Wait for the modal's OWN /auth/me GET before asserting, so myId is available
      // to the component (avoids a render race under load).
      const meResp = page
        .waitForResponse((r) => r.url().includes("/auth/me") && r.request().method() === "GET", { timeout: 20000 })
        .catch(() => null);
      await page.click(`[data-testid="policy-row-${POLICY_ID}"]`);
      await page.waitForSelector('[data-testid="pending-request"]', { timeout: 20000 });
      await meResp;
      await page.waitForLoadState("networkidle");
      approveVisible = (await page.locator('[data-testid="approve-request"]').count()) > 0;
      for (let i = 0; i < 12 && !approveVisible; i++) {
        await page.waitForTimeout(500);
        approveVisible = (await page.locator('[data-testid="approve-request"]').count()) > 0;
      }
    }

    const okNew = newRiskVisible === c.newRisk;
    const okApprove = !checkApprove || approveVisible === c.approve;
    if (!okNew || !okApprove) failures++;
    results.push({
      role: c.key,
      newRisk: { got: newRiskVisible, want: c.newRisk, ok: okNew },
      approve: checkApprove ? { got: approveVisible, want: c.approve, ok: okApprove } : "skipped"
    });
  } catch (e) {
    failures++;
    results.push({ role: c.key, error: String(e).slice(0, 300) });
  } finally {
    await ctx.close();
    await browser.close();
  }
}

console.log(JSON.stringify(results, null, 2));
console.log(failures === 0 ? "\nALL GATING ASSERTIONS PASSED" : `\n${failures} ASSERTION(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
