import { test, expect } from "playwright/test";

// Authorized create-via-UI mutations for representative group-B domains, each
// verified by a re-fetch (the created entity appears in its list after a real
// backend round-trip). Runs as admin (holds all the required permissions).

test("mutation(5-12): register an AI system end-to-end via the UI", async ({ page }, testInfo) => {
  const name = `PartD E2E AISystem ${Date.now()}`;
  await page.goto("/dashboard/ai-systems");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.getByRole("button", { name: /Register system/i }).first().click();
  await page.locator("#sys-name").waitFor({ state: "visible", timeout: 10_000 });
  await page.fill("#sys-name", name);
  await page.locator('form:has(#sys-name) button[type="submit"]').click();
  await page.waitForTimeout(2500);
  await page.goto("/dashboard/ai-systems");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);
  const appears = await page.getByText(name, { exact: false }).count();
  await testInfo.attach("mutation-ai-system", { body: JSON.stringify({ name, appears }, null, 2), contentType: "application/json" });
  console.log(`MUTATION5-12 register-ai-system: "${name}" visible=${appears > 0}`);
  expect(appears, "registered AI system should appear after a real backend round-trip").toBeGreaterThan(0);
});

test("mutation(5-12): create an audit engagement end-to-end via the UI", async ({ page }, testInfo) => {
  const title = `PartD E2E Engagement ${Date.now()}`;
  await page.goto("/dashboard/audit-pack");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.getByTestId("open-engagement-modal").click();
  await page.locator("#eng-title").waitFor({ state: "visible", timeout: 10_000 });
  await page.fill("#eng-title", title);
  // audit_type defaults to internal_readiness; start/end dates are required.
  await page.fill("#eng-start", "2027-01-01");
  await page.fill("#eng-end", "2027-02-01");
  await page.locator('form:has(#eng-title) button[type="submit"]').click();
  await page.waitForTimeout(2500);
  await page.goto("/dashboard/audit-pack");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);
  const appears = await page.getByText(title, { exact: false }).count();
  await testInfo.attach("mutation-engagement", { body: JSON.stringify({ title, appears }, null, 2), contentType: "application/json" });
  console.log(`MUTATION5-12 create-engagement: "${title}" visible=${appears > 0}`);
  expect(appears, "created engagement should appear after a real backend round-trip").toBeGreaterThan(0);
});

test("mutation(5-12): create an autopilot policy end-to-end via the UI", async ({ page }, testInfo) => {
  const name = `PartD E2E Autopilot Policy ${Date.now()}`;
  await page.goto("/dashboard/autopilot");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.getByTestId("new-policy").click();
  await page.locator("#pol-name").waitFor({ state: "visible", timeout: 10_000 });
  await page.fill("#pol-name", name);
  await page.locator('form:has(#pol-name) button[type="submit"]').click();
  await page.waitForTimeout(2500);
  await page.goto("/dashboard/autopilot");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);
  const appears = await page.getByText(name, { exact: false }).count();
  await testInfo.attach("mutation-autopilot-policy", { body: JSON.stringify({ name, appears }, null, 2), contentType: "application/json" });
  console.log(`MUTATION5-12 create-autopilot-policy: "${name}" visible=${appears > 0}`);
  expect(appears, "created autopilot policy should appear after a real backend round-trip").toBeGreaterThan(0);
});
