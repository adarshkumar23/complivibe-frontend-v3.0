import { test, expect } from "playwright/test";

// Permission-gating matrix, focused on the reviewer de-scope that went live today.
// The running project name = persona key. "New Risk" is gated by useHasPermission("risks:write").
// risks:write holders after de-scope: admin, compliance_manager. NOT reviewer(×2)/auditor/readonly.
const CAN_WRITE_RISKS = new Set(["admin", "compliance_manager"]);

test("gating: New Risk button reflects risks:write per role (reviewer de-scope)", async ({ page }, testInfo) => {
  const persona = testInfo.project.name;
  await page.goto("/dashboard/risks");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500);
  const count = await page.getByRole("button", { name: /New Risk/i }).count();
  const expected = CAN_WRITE_RISKS.has(persona);
  await testInfo.attach("gating", {
    body: JSON.stringify({ persona, expectVisible: expected, actualCount: count }, null, 2),
    contentType: "application/json",
  });
  console.log(`GATING ${persona}: New Risk visible=${count > 0} (expected ${expected})`);
  expect(count > 0, `New Risk button gating wrong for ${persona}`).toBe(expected);
});
