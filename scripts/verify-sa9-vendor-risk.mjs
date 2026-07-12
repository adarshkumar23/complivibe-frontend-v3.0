import { chromium } from "playwright";
import fs from "node:fs";

const base = "http://127.0.0.1:3777";
const api = "http://127.0.0.1:8123";
const ORG = "3f663d8b-0d8a-439c-b5b5-be0f94198fe2";
const outDir = "reports/completion-pass/sa9-vendor-risk";
fs.mkdirSync(outDir, { recursive: true });

const stamp = Date.now();
const vendorName = `SA9 Verify Vendor ${stamp}`;
const vendorNameEdited = `${vendorName} (edited)`;

// ── backend session for GET-proof ────────────────────────────────────────────
const loginRes = await fetch(`${api}/api/v1/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@complivibe.io", password: "PhaseA-Rebuild-2026!" })
});
const { access_token } = await loginRes.json();
const H = { Authorization: `Bearer ${access_token}`, "X-Organization-ID": ORG };
const apiGet = async (p) => (await fetch(`${api}${p}`, { headers: H })).json();

const evidence = { steps: [] };
const log = (name, data) => {
  evidence.steps.push({ name, data });
  console.log(`\n== ${name} ==\n${JSON.stringify(data, null, 2)}`);
};

// ── browser ──────────────────────────────────────────────────────────────────
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

await page.goto(`${base}/dashboard/vendor-risk`, { waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-testid="add-vendor"]', { timeout: 20000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${outDir}/01-initial.png`, fullPage: true });

const bodyBefore = await page.textContent("body");
log("initial-state", {
  hasP0Vendor: bodyBefore.includes("P0-Verify Vendor (overdue check)"),
  hasOverdueBadge: bodyBefore.includes("Assessment overdue")
});

// ── 1. CREATE vendor through UI ──────────────────────────────────────────────
await page.click('[data-testid="add-vendor"]');
await page.waitForSelector('[data-testid="vendor-form"]');
await page.fill("#vendor-name", vendorName);
await page.selectOption("#vendor-type", "data_processor");
await page.selectOption("#vendor-owner", { index: 1 }); // first real org user
await page.selectOption("#vendor-tier", "high");
await page.fill("#vendor-spend", "250000");
await page.fill("#vendor-contact-email", "security@sa9-verify.example.com");
await page.fill("#vendor-description", "Created by SA9 live verification");
await page.check('[data-testid="vendor-form"] input[type="checkbox"] >> nth=1'); // personal data
await page.screenshot({ path: `${outDir}/02-create-form.png`, fullPage: true });
await page.click('[data-testid="vendor-form-submit"]');
// no-reload UI update: new row must appear in the register
await page.waitForSelector(`li:has-text("${vendorName}")`, { timeout: 15000 });
await page.screenshot({ path: `${outDir}/03-created-in-list.png`, fullPage: true });

const vendorsAfterCreate = await apiGet("/api/v1/compliance/vendors?limit=200");
const created = vendorsAfterCreate.find((v) => v.name === vendorName);
log("create-vendor-api-proof", created ?? { ERROR: "vendor not found via API" });
if (!created) {
  await browser.close();
  process.exit(1);
}

// ── 2. EDIT vendor through UI ────────────────────────────────────────────────
await page.click(`[data-testid="edit-vendor-${created.id}"]`);
await page.waitForSelector('[data-testid="vendor-form"]');
log("edit-form-prefill", {
  prefilledName: await page.inputValue("#vendor-name"),
  prefilledOwner: await page.inputValue("#vendor-owner"),
  prefilledSpend: await page.inputValue("#vendor-spend")
});
await page.fill("#vendor-name", vendorNameEdited);
await page.fill("#vendor-spend", "500000");
await page.selectOption("#vendor-tier", "critical");
await page.click('[data-testid="vendor-form-submit"]');
await page.waitForSelector(`li:has-text("${vendorNameEdited}")`, { timeout: 15000 });
await page.screenshot({ path: `${outDir}/04-edited-in-list.png`, fullPage: true });

const editedVendor = await apiGet(`/api/v1/compliance/vendors/${created.id}`);
log("edit-vendor-api-proof", {
  name: editedVendor.name,
  risk_tier: editedVendor.risk_tier,
  annual_spend_amount: editedVendor.annual_spend_amount
});

// ── 3. CREATE assessment from the vendor row ────────────────────────────────
await page.click(`[data-testid="assess-vendor-${created.id}"]`);
await page.waitForSelector('[data-testid="assessment-form"]');
await page.fill("#assessment-title", `SA9 triggered review ${stamp}`);
await page.selectOption("#assessment-type", "triggered");
await page.fill("#assessment-due", "2026-08-15"); // future date — must NOT flag overdue
await page.screenshot({ path: `${outDir}/05-assessment-form.png`, fullPage: true });
await page.click('[data-testid="assessment-form-submit"]');
await page.waitForSelector('[data-testid="assessment-form"]', { state: "detached", timeout: 15000 });
await page.waitForTimeout(2000);

const assessments = await apiGet(`/api/v1/compliance/vendors/${created.id}/assessments`);
log("assessment-api-proof", assessments.map((a) => ({
  id: a.id, title: a.title, type: a.assessment_type, status: a.status, due: a.due_date, overdue: a.is_overdue
})));
const vendorAfterAssess = await apiGet(`/api/v1/compliance/vendors/${created.id}`);
log("vendor-not-overdue-after-future-assessment", {
  has_overdue_assessment: vendorAfterAssess.has_overdue_assessment
});

// ── 4. HHI concentration compute through UI ─────────────────────────────────
const concBefore = await apiGet("/api/v1/vendor-concentration-risk");
log("concentration-before", { status: concBefore.status, hhi: concBefore.hhi_score });
const computeBtn = page.locator('[data-testid="compute-concentration"], [data-testid="recompute-concentration"]');
await computeBtn.first().click();
// no-reload update: HHI score row appears in the card
await page.waitForSelector("text=HHI score", { timeout: 15000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${outDir}/06-hhi-computed.png`, fullPage: true });

const concAfter = await apiGet("/api/v1/vendor-concentration-risk");
log("concentration-after-api-proof", {
  status: concAfter.status,
  hhi_score: concAfter.hhi_score,
  threshold: concAfter.threshold_hhi_score,
  top_vendor: concAfter.top_vendor_name,
  top_share_bp: concAfter.top_vendor_share_basis_points,
  exposures: concAfter.exposure_count,
  critical_vendors: concAfter.critical_vendor_count,
  dependencies: concAfter.dependency_count,
  risk_id: concAfter.risk_id,
  recomputed_at: concAfter.recomputed_at
});

// KPI tile should now show the HHI value without reload
const kpiText = await page.evaluate(() => {
  const els = Array.from(document.querySelectorAll("*"));
  const label = els.find((e) => e.children.length === 0 && /Concentration \(HHI\)/i.test(e.textContent || ""));
  const card = label?.closest("div")?.parentElement;
  return card ? card.textContent : null;
});
log("hhi-kpi-tile-no-reload", { kpiText });

// ── 5. P0 vendor untouched + zero console errors ────────────────────────────
const finalVendors = await apiGet("/api/v1/compliance/vendors?limit=200");
const p0v = finalVendors.find((v) => v.name === "P0-Verify Vendor (overdue check)");
log("p0-vendor-intact", { present: Boolean(p0v), still_overdue: p0v?.has_overdue_assessment });
log("console-errors", consoleErrors);

fs.writeFileSync(`${outDir}/evidence.json`, JSON.stringify(evidence, null, 2));
await browser.close();
console.log("\nDONE");
