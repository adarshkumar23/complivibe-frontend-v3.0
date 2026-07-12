import { chromium } from "playwright";

const base = "http://127.0.0.1:3777";
const outDir = "reports/completion-pass/sa7-dpdp";
const stamp = Date.now();
const consentSubject = `verify-consent-${stamp}@example.com`;
const dsarEmail = `verify-dsar-${stamp}@example.com`;
const grievanceEmail = `verify-grievance-${stamp}@example.com`;

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1512, height: 982 } });
const page = await ctx.newPage();
const consoleErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => consoleErrors.push("PAGEERROR: " + e.message));

await page.goto(`${base}/login`, { waitUntil: "networkidle" });
await page.fill('input[type="email"]', "admin@complivibe.io");
await page.fill('input[type="password"]', "PhaseA-Rebuild-2026!");
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard**", { timeout: 20000 });

// ── 1. Nav entry: sidebar has "DPDP (India)" and it navigates ────────────────
const navBtn = page.locator("aside").getByRole("button", { name: "DPDP (India)" });
console.log("nav entry visible:", await navBtn.isVisible());
await navBtn.click();
await page.waitForURL("**/dashboard/privacy/dpdp", { timeout: 15000 });
console.log("nav navigated to:", page.url());
await page.waitForTimeout(4000);
await page.screenshot({ path: `${outDir}/01-dpdp-page-via-nav.png`, fullPage: true });

// KPI value before mutations (Active Consents tile)
async function kpiText(label) {
  return page.evaluate((lbl) => {
    const els = Array.from(document.querySelectorAll("*"));
    const el = els.find((e) => e.children.length === 0 && (e.textContent || "").trim() === lbl);
    if (!el) return null;
    return el.closest("div")?.parentElement?.textContent ?? null;
  }, label);
}
const consentKpiBefore = await kpiText("Active Consents");
console.log("Active Consents KPI before:", JSON.stringify(consentKpiBefore));

// ── 2. Consent create form ───────────────────────────────────────────────────
await page.selectOption("#consent-activity", { index: 1 });
await page.fill("#consent-subject", consentSubject);
await page.selectOption("#consent-mechanism", "written_form");
await page.fill("#consent-version", "v1.0");
await page.getByRole("button", { name: "Record consent" }).click();
await page.waitForSelector('[data-testid="consent-created"]', { timeout: 15000 });
const consentBox = await page.textContent('[data-testid="consent-created"]');
console.log("consent created box:", JSON.stringify(consentBox));
const consentId = (consentBox.match(/id: ([0-9a-f-]{36})/) || [])[1];
console.log("consent id:", consentId);
await page.waitForTimeout(3000); // allow invalidated consent-summary to refetch
const consentKpiAfter = await kpiText("Active Consents");
console.log("Active Consents KPI after (no reload):", JSON.stringify(consentKpiAfter));
await page.screenshot({ path: `${outDir}/02-consent-created.png`, fullPage: true });

// ── 3. DSAR (rights request) ─────────────────────────────────────────────────
await page.fill("#dsr-name", "Verify DSAR Subject");
await page.fill("#dsr-email", dsarEmail);
await page.selectOption("#dsr-type", "access");
await page.selectOption("#dsr-framework", "dpdp");
await page.fill("#dsr-description", "Playwright end-to-end verification of DSAR submission.");
await page.getByRole("button", { name: "Submit request" }).click();
await page.waitForSelector('[data-testid="dsr-created"]', { timeout: 15000 });
console.log("dsar created box:", JSON.stringify(await page.textContent('[data-testid="dsr-created"]')));
// tracker updates without reload
await page.waitForFunction(
  (email) => (document.body.textContent || "").includes(email),
  dsarEmail,
  { timeout: 15000 }
);
console.log("DSAR visible in tracker without reload: true");
await page.screenshot({ path: `${outDir}/03-dsar-created.png`, fullPage: true });

// ── 4. Grievance (same endpoint, request_subtype=grievance) ─────────────────
await page.getByRole("tab", { name: "Grievance" }).click();
await page.fill("#dsr-name", "Verify Grievance Subject");
await page.fill("#dsr-email", grievanceEmail);
await page.selectOption("#dsr-type", "erasure");
await page.selectOption("#dsr-framework", "dpdp");
await page.fill("#dsr-description", "Erasure request ignored for 30 days; seeking remediation (verification run).");
await page.getByRole("button", { name: "Submit grievance" }).click();
// the box already exists from the previous DSAR — wait for it to show the grievance
await page.waitForFunction(
  () => (document.querySelector('[data-testid="dsr-created"]')?.textContent || "").includes("Grievance received"),
  undefined,
  { timeout: 15000 }
);
const grievanceBox = await page.textContent('[data-testid="dsr-created"]');
console.log("grievance created box:", JSON.stringify(grievanceBox));
console.log("grievance box mentions 90d SLA:", /90d SLA/.test(grievanceBox));
await page.waitForFunction(
  (email) => (document.body.textContent || "").includes(email),
  grievanceEmail,
  { timeout: 15000 }
);
console.log("grievance visible in tracker without reload: true");
await page.screenshot({ path: `${outDir}/04-grievance-created.png`, fullPage: true });

// ── 5. Main privacy page also carries the forms ──────────────────────────────
await page.goto(`${base}/dashboard/privacy`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4000);
const mainBody = await page.textContent("body");
console.log("main privacy page has Record Consent:", mainBody.includes("Record Consent"));
console.log("main privacy page has Submit Request or Grievance:", mainBody.includes("Submit Request or Grievance"));
await page.screenshot({ path: `${outDir}/05-main-privacy-page.png`, fullPage: true });

console.log("console errors:", JSON.stringify(consoleErrors.slice(0, 10)));
console.log("EVIDENCE", JSON.stringify({ consentSubject, dsarEmail, grievanceEmail, consentId }));
await browser.close();
