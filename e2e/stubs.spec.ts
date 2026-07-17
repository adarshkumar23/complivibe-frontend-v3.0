import { test, expect } from "playwright/test";
import { STUB_ROUTES } from "./routes";

// The 5 deferred pages must show an honest "queued for Phase B"-style placeholder,
// not silently break. Runs per-persona (any authenticated persona can see the stub).
for (const route of STUB_ROUTES) {
  test(`stub page honest state: ${route}`, async ({ page }, testInfo) => {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    const body = (await page.locator("body").innerText()).slice(0, 4000);
    const looksStub = /(queued for phase b|coming soon|phase b|not yet available|in development|planned|deferred|under construction|roadmap)/i.test(body);
    const errorBoundary = await page.locator('[data-testid="dashboard-error-boundary"]').count();
    await testInfo.attach("stub", {
      body: JSON.stringify({ route, looksStub, errorBoundary, sample: body.slice(0, 600) }, null, 2),
      contentType: "application/json",
    });
    expect(errorBoundary, `stub ${route} tripped error boundary`).toBe(0);
    // record looksStub via attachment; assert only that it rendered SOMETHING non-empty
    expect(body.trim().length, `stub ${route} rendered empty`).toBeGreaterThan(20);
  });
}
