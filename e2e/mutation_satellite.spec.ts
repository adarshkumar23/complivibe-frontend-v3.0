import { test, expect } from "playwright/test";

// Authorized create-via-UI mutations for representative satellite domains, each
// verified by a re-fetch (the created entity appears in its list after a real
// backend round-trip). Runs as admin (holds all required permissions). The full
// writer-2xx / non-writer-403 RBAC matrix across all satellite endpoints lives in
// directapi_satellite.spec.ts; this proves the gated UI path actually mutates.

test("mutation(satellite): create a business unit end-to-end via the UI", async ({ page }, testInfo) => {
  const stamp = Date.now();
  const name = `PartD E2E BU ${stamp}`;
  const code = `PARTD-BU-${stamp}`;
  await page.goto("/dashboard/enterprise");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.getByTestId("new-business-unit").click();
  await page.locator("#bu-name").waitFor({ state: "visible", timeout: 10_000 });
  await page.fill("#bu-name", name);
  await page.fill("#bu-code", code);
  await page.locator('form:has(#bu-name) button[type="submit"]').click();
  await page.waitForTimeout(2500);
  await page.goto("/dashboard/enterprise");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);
  const appears = await page.getByText(name, { exact: false }).count();
  await testInfo.attach("mutation-business-unit", { body: JSON.stringify({ name, code, appears }, null, 2), contentType: "application/json" });
  console.log(`MUTATION-SAT business-unit: "${name}" visible=${appears > 0}`);
  expect(appears, "created business unit should appear after a real backend round-trip").toBeGreaterThan(0);
});

test("mutation(satellite): register a non-human identity end-to-end via the UI", async ({ page }, testInfo) => {
  const name = `partd-e2e-nhi-${Date.now()}`;
  await page.goto("/dashboard/security");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.getByTestId("register-nhi").click();
  await page.locator("#nhi-name").waitFor({ state: "visible", timeout: 10_000 });
  await page.fill("#nhi-name", name);
  // owner is a required select; pick the first real option (org members).
  const owner = page.locator("#nhi-owner");
  const optionValues = await owner.locator("option").evaluateAll((opts) =>
    opts.map((o) => (o as HTMLOptionElement).value).filter((v) => v)
  );
  if (optionValues.length > 0) await owner.selectOption(optionValues[0]);
  await page.locator('form:has(#nhi-name) button[type="submit"]').click();
  await page.waitForTimeout(2500);
  await page.goto("/dashboard/security");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);
  const appears = await page.getByText(name, { exact: false }).count();
  await testInfo.attach("mutation-nhi", { body: JSON.stringify({ name, appears }, null, 2), contentType: "application/json" });
  console.log(`MUTATION-SAT register-nhi: "${name}" visible=${appears > 0}`);
  expect(appears, "registered NHI should appear after a real backend round-trip").toBeGreaterThan(0);
});
