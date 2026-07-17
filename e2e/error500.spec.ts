import { test, expect } from "playwright/test";

// C3 — trigger REAL backend 500s (network layer returns HTTP 500 to the app's
// fetches; NOT a synthetic JS throw) on a sample of DIFFERENT page types, and
// classify actual behavior: error-boundary / graceful isError UI / silent empty.
// Auth endpoints are left succeeding so the shell/session stays up and we isolate
// each PAGE's data-500 behavior.
const SAMPLE = [
  { route: "/dashboard/risks", type: "table/register" },
  { route: "/dashboard/policies", type: "list + modal" },
  { route: "/dashboard/executive", type: "dashboard/charts" },
  { route: "/dashboard/evidence", type: "list" },
  { route: "/dashboard/vendor-risk", type: "table+kpis" },
  { route: "/dashboard/compliance", type: "domain overview" },
  { route: "/dashboard/incidents", type: "list" },
  { route: "/dashboard/score-explainer", type: "specialized" },
  { route: "/dashboard/controls", type: "table" },
  { route: "/dashboard/insights", type: "cards (phase-3)" },
];

for (const { route, type } of SAMPLE) {
  test(`C3 forced-500: ${route} (${type})`, async ({ page }, testInfo) => {
    // 500 every non-auth API call; let auth succeed so the shell survives.
    await page.route("**/api/v1/**", async (r) => {
      const u = r.request().url();
      if (u.includes("/api/v1/auth/")) return r.continue();
      return r.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ detail: "injected 500 (C3)" }) });
    });
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));

    await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    // Global QueryClient uses retry:1 (~1s backoff), so an error state can take
    // >1.2s to appear. Wait long enough for retries to exhaust before classifying.
    await page.waitForTimeout(4000);

    const errorBoundary = await page.locator('[data-testid="dashboard-error-boundary"]').count();
    const rawCrash = await page.getByText(/Application error: a client-side exception/i).count();
    const body = (await page.locator("main, body").first().innerText()).slice(0, 8000);
    // PRECISE detection: the shared <ErrorState> renders a "Retry section" button
    // whenever onRetry is passed (every data panel does). This is the reliable
    // signal, independent of each panel's error-title wording. Also keep a
    // broadened text fallback (the original regex missed "could not load" /
    // "unavailable" / raw axios messages — the cause of the Part-D C3 false alarms).
    const retryButtons = await page.getByRole("button", { name: /Retry section/i }).count();
    const hasErrorText =
      retryButtons > 0 ||
      /(could not load|couldn.t load|unable to load|failed to load|failed to fetch|unavailable|something went wrong|went wrong|error loading|an error occurred|please try again|recalculation failed|status code 5\d\d|request failed)/i.test(body);

    let verdict: string;
    if (rawCrash > 0) verdict = "RAW_CRASH";
    else if (errorBoundary > 0) verdict = "ERROR_BOUNDARY";
    else if (hasErrorText) verdict = "GRACEFUL_ISERROR";
    else verdict = "SILENT_EMPTY"; // rendered, no data, no error shown — the UX gap

    await testInfo.attach("c3", {
      body: JSON.stringify({ route, type, verdict, errorBoundary, rawCrash, retryButtons, hasErrorText, pageErrors, sample: body.slice(0, 500) }, null, 2),
      contentType: "application/json",
    });
    console.log(`C3 ${route} => ${verdict}${pageErrors.length ? " (+pageError)" : ""}`);

    // The only hard failure is a raw uncaught crash; the rest are classified for the report.
    expect(rawCrash, `raw client crash on ${route} under 500`).toBe(0);
  });
}
