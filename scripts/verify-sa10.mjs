import { chromium } from "playwright";
import fs from "node:fs";

const base = "http://127.0.0.1:3777";
const shotDir = "reports/completion-pass/sa10-search-observability";
fs.mkdirSync(shotDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1512, height: 982 } });
const page = await ctx.newPage();
const consoleErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => consoleErrors.push("PAGEERROR: " + e.message));

const apiCalls = [];
page.on("response", async (r) => {
  const url = r.url();
  if (/\/api\/proxy\/api\/v1\/(search|scoring|data-observability)/.test(url)) {
    apiCalls.push({ url: url.replace(base, ""), status: r.status() });
  }
});

await page.goto(`${base}/login`, { waitUntil: "networkidle" });
await page.fill('input[type="email"]', "admin@complivibe.io");
await page.fill('input[type="password"]', "PhaseA-Rebuild-2026!");
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard**", { timeout: 20000 });

// ── 1. Topbar global search: live dropdown + enter → results page ────────────
await page.goto(`${base}/dashboard`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);
const searchInput = page.locator('input[aria-label="Search the workspace"]');
await searchInput.click();
await searchInput.fill("MFA");
const dropdown = page.locator('[data-testid="topbar-search-dropdown"]');
await dropdown.waitFor({ state: "visible", timeout: 10000 });
await page.waitForTimeout(1500); // debounce + fetch
const dropdownText = await dropdown.textContent();
console.log("dropdown text:", JSON.stringify(dropdownText?.slice(0, 300)));
const hitCount = await dropdown.locator("[data-search-hit]").count();
console.log("dropdown hit rows:", hitCount);
await page.screenshot({ path: `${shotDir}/01-topbar-search-dropdown.png` });

if (hitCount > 0) {
  // Click the first real hit → deep link
  const firstHref = await dropdown.locator("[data-search-hit]").first().getAttribute("href");
  await dropdown.locator("[data-search-hit]").first().click();
  await page.waitForTimeout(2500);
  console.log("clicked first hit, expected href:", firstHref, "→ now at:", page.url());
  await page.screenshot({ path: `${shotDir}/02-search-hit-deep-link.png` });
  await page.goto(`${base}/dashboard`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await searchInput.click();
  await searchInput.fill("MFA");
  await dropdown.waitFor({ state: "visible", timeout: 10000 });
}

await searchInput.press("Enter");
await page.waitForURL("**/dashboard/search?q=MFA**", { timeout: 10000 });
await page.waitForTimeout(2500);
const searchPageBody = await page.textContent("body");
console.log("search page shows query:", searchPageBody.includes("MFA"));
console.log("search page hit rows:", await page.locator("[data-search-hit]").count());
await page.screenshot({ path: `${shotDir}/03-search-results-page.png`, fullPage: true });

// If there are results on the page, navigate through one.
const pageHits = page.locator("[data-search-hit]");
if ((await pageHits.count()) > 0) {
  const href = await pageHits.first().getAttribute("href");
  await pageHits.first().click();
  await page.waitForTimeout(2500);
  console.log("results-page hit navigates to:", href, "→", page.url());
  await page.screenshot({ path: `${shotDir}/04-search-result-navigated.png` });
}

// ── 2. Score explainer via the score KPI ─────────────────────────────────────
await page.goto(`${base}/dashboard`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);
await page.click('a[aria-label="Explain the compliance score"]');
await page.waitForURL("**/dashboard/score-explainer**", { timeout: 10000 });
await page.waitForTimeout(3000);
const body2 = await page.textContent("body");
console.log("explainer: has 'how it was computed':", body2.includes("how it was computed"));
console.log("explainer: has formula text:", body2.includes("verified_coverage") || body2.includes("implemented_ratio"));
console.log("explainer: has methodology caveats:", body2.includes("Caveats"));
await page.screenshot({ path: `${shotDir}/05-score-explainer.png`, fullPage: true });

// Recalculate (real mutation), confirm UI updates without reload
const beforeTs = await page.locator('[data-testid="score-card-compliance_readiness"]').count();
console.log("score cards present:", beforeTs > 0);
await page.click('[data-testid="recalculate-scores"]');
await page.waitForTimeout(4000);
const body3 = await page.textContent("body");
console.log("explainer after recalc still shows breakdown:", body3.includes("how it was computed"));
await page.screenshot({ path: `${shotDir}/06-score-explainer-recalculated.png`, fullPage: true });

// ── 3. Data observability via bottom mode switcher ───────────────────────────
await page.goto(`${base}/dashboard`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
await page.click('button:has-text("Data Observability")');
await page.waitForURL("**/dashboard/data-observability**", { timeout: 10000 });
await page.waitForTimeout(3500);
const obsBody = await page.textContent("body");
console.log("obs page: has 'Data asset inventory':", obsBody.includes("Data asset inventory"));
console.log("obs page: has insights section:", obsBody.includes("Backend insights"));
await page.screenshot({ path: `${shotDir}/07-data-observability.png`, fullPage: true });

// Register a real asset through the modal
await page.click('[data-testid="register-asset"]');
await page.waitForTimeout(1200);
const assetName = `Customer billing DB (verify ${Date.now().toString().slice(-6)})`;
await page.fill("#asset-name", assetName);
await page.selectOption("#asset-type", "database");
await page.selectOption("#asset-owner", { index: 1 });
await page.selectOption("#asset-tier", "confidential");
await page.selectOption("#asset-class", "financial_data");
await page.fill("#asset-source", "AWS RDS ap-south-1");
await page.fill("#asset-desc", "Registered via SA-10 live verification");
await page.screenshot({ path: `${shotDir}/08-register-asset-modal.png` });
await page.click('button:has-text("Register asset"):not([data-testid])');
await page.waitForTimeout(4000);
const obsBody2 = await page.textContent("body");
console.log("asset appears in table without reload:", obsBody2.includes(assetName));
console.log("ASSET_NAME=" + assetName);
await page.screenshot({ path: `${shotDir}/09-asset-registered.png`, fullPage: true });

// ── 4. Lineage page ──────────────────────────────────────────────────────────
await page.click('a[href="/dashboard/data-observability/lineage"]');
await page.waitForURL("**/lineage**", { timeout: 10000 });
await page.waitForTimeout(3500);
const linBody = await page.textContent("body");
console.log("lineage: has graph section:", linBody.includes("Asset lineage graph"));
console.log("lineage: has nodes section:", linBody.includes("Lineage nodes"));
await page.screenshot({ path: `${shotDir}/10-lineage.png`, fullPage: true });

console.log("API calls seen:", JSON.stringify(apiCalls.slice(0, 30), null, 1));
console.log("console errors:", JSON.stringify(consoleErrors.slice(0, 10)));
await browser.close();
