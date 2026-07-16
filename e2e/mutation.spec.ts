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
