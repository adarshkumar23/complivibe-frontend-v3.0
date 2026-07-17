import { test, expect } from "playwright/test";

// Representative REAL mutation E2E (admin): drive the New Risk form through the UI
// and confirm the risk is actually persisted by the real backend (re-fetch shows it).
test("mutation: create a risk end-to-end via the UI", async ({ page }, testInfo) => {
  const title = `PartD E2E Risk ${Date.now()}`;
  await page.goto("/dashboard/risks");
  await page.waitForLoadState("networkidle").catch(() => {});

  await page.getByRole("button", { name: /New Risk/i }).click();
  await page.locator("#risk-title").waitFor({ state: "visible", timeout: 10_000 });
  await page.fill("#risk-title", title);
  // submit the form (button[type=submit] inside the risk form)
  await page.locator('form:has(#risk-title) button[type="submit"]').click();

  // modal should close; the new risk should appear in the register after the real POST + refetch
  await page.waitForTimeout(2500);
  await page.goto("/dashboard/risks");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);
  const appears = await page.getByText(title, { exact: false }).count();

  await testInfo.attach("mutation", { body: JSON.stringify({ title, appearsInRegister: appears }, null, 2), contentType: "application/json" });
  console.log(`MUTATION create-risk: "${title}" persisted+visible=${appears > 0}`);
  expect(appears, "created risk should appear in the register after a real backend round-trip").toBeGreaterThan(0);
});

// Controls: drive the New Control form and confirm the real backend persisted it
// (re-fetch shows it in the register). Runs as admin (has controls:write).
test("mutation: create a control end-to-end via the UI", async ({ page }, testInfo) => {
  const title = `PartD E2E Control ${Date.now()}`;
  await page.goto("/dashboard/controls");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.getByRole("button", { name: /New control/i }).click();
  await page.locator("#control-title").waitFor({ state: "visible", timeout: 10_000 });
  await page.fill("#control-title", title);
  // control-type defaults to "technical" and criticality to "medium" -- title is all we must set.
  await page.locator('form:has(#control-title) button[type="submit"]').click();

  await page.waitForTimeout(2500);
  await page.goto("/dashboard/controls");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);
  const appears = await page.getByText(title, { exact: false }).count();
  await testInfo.attach("mutation-control", { body: JSON.stringify({ title, appearsInRegister: appears }, null, 2), contentType: "application/json" });
  console.log(`MUTATION create-control: "${title}" persisted+visible=${appears > 0}`);
  expect(appears, "created control should appear in the register after a real backend round-trip").toBeGreaterThan(0);
});

// Policies: the submit is a non-native handler ([data-testid=policy-form-submit]);
// owner is required. Runs as admin (has compliance_policies:write).
test("mutation: create a policy end-to-end via the UI", async ({ page }, testInfo) => {
  const title = `PartD E2E Policy ${Date.now()}`;
  await page.goto("/dashboard/policies");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.getByTestId("new-policy").click();
  await page.locator("#policy-title").waitFor({ state: "visible", timeout: 10_000 });
  await page.fill("#policy-title", title);
  await page.selectOption("#policy-owner", { index: 1 }); // first real org user (index 0 = "Select owner…")
  await page.getByTestId("policy-form-submit").click();

  await page.waitForTimeout(2500);
  await page.goto("/dashboard/policies");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);
  const appears = await page.getByText(title, { exact: false }).count();
  await testInfo.attach("mutation-policy", { body: JSON.stringify({ title, appearsInRegister: appears }, null, 2), contentType: "application/json" });
  console.log(`MUTATION create-policy: "${title}" persisted+visible=${appears > 0}`);
  expect(appears, "created policy should appear in the library after a real backend round-trip").toBeGreaterThan(0);
});

// Vendors: submit via [data-testid=vendor-form-submit]; owner required. Runs as
// admin (has vendors:write).
test("mutation: create a vendor end-to-end via the UI", async ({ page }, testInfo) => {
  const name = `PartD E2E Vendor ${Date.now()}`;
  await page.goto("/dashboard/vendor-risk");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.getByTestId("add-vendor").click();
  await page.locator("#vendor-name").waitFor({ state: "visible", timeout: 10_000 });
  await page.fill("#vendor-name", name);
  await page.selectOption("#vendor-owner", { index: 1 });
  await page.getByTestId("vendor-form-submit").click();

  await page.waitForTimeout(2500);
  await page.goto("/dashboard/vendor-risk");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);
  const appears = await page.getByText(name, { exact: false }).count();
  await testInfo.attach("mutation-vendor", { body: JSON.stringify({ name, appearsInRegister: appears }, null, 2), contentType: "application/json" });
  console.log(`MUTATION create-vendor: "${name}" persisted+visible=${appears > 0}`);
  expect(appears, "created vendor should appear in the register after a real backend round-trip").toBeGreaterThan(0);
});
