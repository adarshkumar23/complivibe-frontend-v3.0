import { test, expect, type Page, type Locator } from "playwright/test";

// Hidden-button gating matrix for the SATELLITE domains. Runs once per persona.
// Each create/action button was wrapped in useHasPermission on the exact
// permission below (parent-verified vs the live catalog), so it must render only
// for personas whose role holds that permission. Only header/form-level buttons
// that render unconditionally (no row data needed) are asserted here; row-level
// and data-dependent controls are covered by directapi_satellite.spec.ts.
type Domain = { key: string; route: string; button: (p: Page) => Locator; allowed: Set<string> };

const ADMIN_CM = new Set(["admin", "compliance_manager"]); // triad write perms (no owner persona)
const ADMIN_ONLY = new Set(["admin"]); // org:update / billing_usage_spend_cap:write

const DOMAINS: Domain[] = [
  // connectors:write
  { key: "connectors:register", route: "/dashboard/cloud-connectors", button: (p) => p.getByTestId("register-connector"), allowed: ADMIN_CM },
  { key: "connectors:add-rule", route: "/dashboard/cloud-connectors", button: (p) => p.getByTestId("add-mapping-rule"), allowed: ADMIN_CM },
  // webhooks:write
  { key: "webhooks:register", route: "/dashboard/webhooks", button: (p) => p.getByTestId("register-webhook"), allowed: ADMIN_CM },
  // ai_systems:write
  { key: "ai-testing:new-assessment", route: "/dashboard/ai-testing", button: (p) => p.getByTestId("new-ai-assessment"), allowed: ADMIN_CM },
  // billing_usage_spend_cap:write — ADMIN-ONLY (CM excluded)
  { key: "billing:spend-cap", route: "/dashboard/billing", button: (p) => p.getByTestId("open-spend-cap"), allowed: ADMIN_ONLY },
  // carbon_accounting:write
  { key: "billing:record-emissions", route: "/dashboard/billing", button: (p) => p.getByTestId("open-record-emissions"), allowed: ADMIN_CM },
  // data:write
  { key: "incidents:report", route: "/dashboard/incidents", button: (p) => p.getByTestId("report-incident"), allowed: ADMIN_CM },
  // issues:write
  { key: "incidents:open-issue", route: "/dashboard/incidents", button: (p) => p.getByTestId("open-issue"), allowed: ADMIN_CM },
  // privacy:write
  { key: "privacy:record-consent", route: "/dashboard/privacy", button: (p) => p.getByTestId("record-consent"), allowed: ADMIN_CM },
  { key: "privacy:submit-dsr", route: "/dashboard/privacy", button: (p) => p.getByTestId("submit-dsr"), allowed: ADMIN_CM },
  // privacy:write (dpdp)
  { key: "dpdp:register-nominee", route: "/dashboard/privacy/dpdp", button: (p) => p.getByTestId("register-nominee"), allowed: ADMIN_CM },
  // compliance:write / recertification:write
  // business-unit create requires org-admin (org:update), NOT just compliance:write
  { key: "enterprise:new-unit", route: "/dashboard/enterprise", button: (p) => p.getByTestId("new-business-unit"), allowed: ADMIN_ONLY },
  { key: "enterprise:new-campaign", route: "/dashboard/enterprise", button: (p) => p.getByTestId("new-accesscert-campaign"), allowed: ADMIN_CM },
  // identity_governance:manage
  { key: "security:register-nhi", route: "/dashboard/security", button: (p) => p.getByTestId("register-nhi"), allowed: ADMIN_CM },
  // NOTE: audit-pack finding/PBC, autopilot plan-action, and SDF-confirm buttons are
  // data-dependent (need a selected engagement / intent / SDF suggestion to render),
  // so their gating is covered at the endpoint level in directapi_satellite.spec.ts
  // rather than via unreliable visibility assertions here.
];

for (const d of DOMAINS) {
  test(`gating(satellite): ${d.key} button reflects its permission per role`, async ({ page }, testInfo) => {
    const persona = testInfo.project.name;
    const expected = d.allowed.has(persona);
    await page.goto(d.route);
    await page.waitForLoadState("networkidle").catch(() => {});
    const button = d.button(page);
    if (expected) {
      await expect(button.first(), `${d.key} should be VISIBLE for ${persona}`).toBeVisible({ timeout: 15_000 });
    } else {
      await page.waitForTimeout(3000); // let the perms query resolve, then confirm absent
      await expect(button, `${d.key} must be HIDDEN for ${persona}`).toHaveCount(0);
    }
    const count = await button.count();
    await testInfo.attach(`gating-${d.key}`, { body: JSON.stringify({ persona, domain: d.key, expectVisible: expected, actualCount: count }, null, 2), contentType: "application/json" });
    console.log(`GATING-SAT ${d.key} ${persona}: visible=${count > 0} (expected ${expected})`);
  });
}
