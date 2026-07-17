import { test, expect, type Page, type Locator } from "playwright/test";

// Hidden-button gating matrix for the group-B domains (those that HAVE mutation
// UI). Runs once per persona project. Each button was gated with useHasPermission
// on the exact permission below (verified vs the live 0307 catalog), so it must
// render only for personas whose role holds that permission. Role sets are
// per-domain because reviewer/auditor hold some of these (unlike the uniform
// {admin, compliance_manager} of the earlier domains).
type Domain = { key: string; route: string; button: (p: Page) => Locator; allowed: Set<string> };

const ADMIN_CM = new Set(["admin", "compliance_manager"]);
const ADMIN_ONLY = new Set(["admin"]);
const ADMIN_CM_REVIEWER = new Set(["admin", "compliance_manager", "reviewer_unassigned", "reviewer_assigned"]);

const DOMAINS: Domain[] = [
  // ai_systems:write
  { key: "ai-systems:register", route: "/dashboard/ai-systems", button: (p) => p.getByRole("button", { name: /Register system/i }), allowed: ADMIN_CM },
  // audit:write
  { key: "audit-pack:new-engagement", route: "/dashboard/audit-pack", button: (p) => p.getByTestId("open-engagement-modal"), allowed: ADMIN_CM },
  // compliance_policies:write
  { key: "attestations:new-campaign", route: "/dashboard/employee-compliance", button: (p) => p.getByRole("button", { name: /New campaign/i }), allowed: ADMIN_CM },
  // reports:generate  (+reviewer)
  { key: "reports:generate", route: "/dashboard/reports", button: (p) => p.getByRole("button", { name: /^Generate$/i }), allowed: ADMIN_CM_REVIEWER },
  // ai_systems:write
  { key: "autopilot:new-policy", route: "/dashboard/autopilot", button: (p) => p.getByTestId("new-policy"), allowed: ADMIN_CM },
  // org:update  (admin-only kill-switch)
  { key: "autopilot:kill-switch", route: "/dashboard/autopilot", button: (p) => p.getByTestId("auto-execute-toggle"), allowed: ADMIN_ONLY },
];

for (const d of DOMAINS) {
  test(`gating(5-12): ${d.key} button reflects its permission per role`, async ({ page }, testInfo) => {
    const persona = testInfo.project.name;
    const expected = d.allowed.has(persona);
    await page.goto(d.route);
    await page.waitForLoadState("networkidle").catch(() => {});
    const button = d.button(page);
    if (expected) {
      await expect(button, `${d.key} should be VISIBLE for ${persona}`).toBeVisible({ timeout: 15_000 });
    } else {
      await page.waitForTimeout(3000); // let the perms query resolve, then confirm absent
      await expect(button, `${d.key} must be HIDDEN for ${persona}`).toHaveCount(0);
    }
    const count = await button.count();
    await testInfo.attach(`gating-${d.key}`, { body: JSON.stringify({ persona, domain: d.key, expectVisible: expected, actualCount: count }, null, 2), contentType: "application/json" });
    console.log(`GATING5-12 ${d.key} ${persona}: visible=${count > 0} (expected ${expected})`);
  });
}
