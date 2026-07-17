import { test, expect } from "playwright/test";
import { CAN_WRITE } from "./apihelpers";

// Permission-gating matrix (the "hidden button" half of the both-sides pattern).
// The running project name = persona key. Each create button is gated by its
// domain write permission via useHasPermission(...). Per the live 0307 catalog,
// controls:write / compliance_policies:write / vendors:write (and risks:write)
// are all held by exactly {admin, compliance_manager}; reviewer(x2)/auditor/
// readonly hold none, so their create button must NOT render.
type Domain = { key: string; route: string; button: (page: import("playwright/test").Page) => import("playwright/test").Locator };

const DOMAINS: Domain[] = [
  { key: "risks", route: "/dashboard/risks", button: (p) => p.getByRole("button", { name: /New Risk/i }) },
  { key: "controls", route: "/dashboard/controls", button: (p) => p.getByRole("button", { name: /New control/i }) },
  { key: "policies", route: "/dashboard/policies", button: (p) => p.getByTestId("new-policy") },
  { key: "vendors", route: "/dashboard/vendor-risk", button: (p) => p.getByTestId("add-vendor") },
];

for (const d of DOMAINS) {
  test(`gating: ${d.key} create button reflects write permission per role`, async ({ page }, testInfo) => {
    const persona = testInfo.project.name;
    const expected = CAN_WRITE.has(persona);
    await page.goto(d.route);
    await page.waitForLoadState("networkidle").catch(() => {});
    // The button renders off an async permissions query (useHasPermission). Some
    // pages (e.g. vendor-risk) load heavier data, so a fixed sleep races that
    // query -- use auto-retrying assertions instead of a one-shot count().
    const button = d.button(page);
    if (expected) {
      await expect(button, `${d.key} create-button should be visible for ${persona}`).toBeVisible({ timeout: 15_000 });
    } else {
      // Give the permissions query time to resolve, then assert the button never
      // renders for a non-writer (a de-scoped role must not see the create action).
      await page.waitForTimeout(3000);
      await expect(button, `${d.key} create-button must be hidden for ${persona}`).toHaveCount(0);
    }
    const count = await button.count();
    await testInfo.attach(`gating-${d.key}`, {
      body: JSON.stringify({ persona, domain: d.key, expectVisible: expected, actualCount: count }, null, 2),
      contentType: "application/json",
    });
    console.log(`GATING ${d.key} ${persona}: create visible=${count > 0} (expected ${expected})`);
  });
}
