import { test, expect } from "playwright/test";
import { ROUTES, BENIGN_CONSOLE } from "./routes";

// One test per route. The persona is determined by the running project's storageState.
for (const route of ROUTES) {
  test(`route renders: ${route}`, async ({ page }, testInfo) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const t = msg.text();
        if (!BENIGN_CONSOLE.some((re) => re.test(t))) consoleErrors.push(t);
      }
    });
    page.on("pageerror", (err) => pageErrors.push(String(err)));

    const resp = await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});

    const finalUrl = page.url();
    const bootedToLogin = /\/login/.test(finalUrl);
    const errorBoundary = await page.locator('[data-testid="dashboard-error-boundary"]').count();
    // Next.js production runtime error surfaces this text; a raw crash shows it too.
    const appErrorText = await page.getByText(/Application error: a client-side exception/i).count();

    // Attach diagnostics for the report.
    await testInfo.attach("diag", {
      body: JSON.stringify(
        { route, finalUrl, status: resp?.status(), bootedToLogin, errorBoundary, appErrorText, consoleErrors, pageErrors },
        null, 2,
      ),
      contentType: "application/json",
    });

    // Hard failures: session lost, error boundary tripped, raw crash, or a page-level JS exception.
    expect(bootedToLogin, `redirected to /login (session lost) from ${route}`).toBe(false);
    expect(errorBoundary, `error boundary tripped on ${route}`).toBe(0);
    expect(appErrorText, `raw client crash on ${route}`).toBe(0);
    expect(pageErrors, `uncaught page error(s) on ${route}: ${pageErrors.join("; ")}`).toEqual([]);
    // Console errors are recorded but non-fatal (many are expected 403s for gated data).
  });
}
