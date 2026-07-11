import { chromium } from "playwright";
import fs from "node:fs";

const base = "http://127.0.0.1:3777";
const api = "http://127.0.0.1:8123";
const ORG = "3f663d8b-0d8a-439c-b5b5-be0f94198fe2";
const outDir = "reports/completion-pass/sa6-audit-pack";
fs.mkdirSync(outDir, { recursive: true });

const evidence = [];
function log(step, data) {
  evidence.push({ step, data });
  console.log(`\n=== ${step} ===`);
  console.log(typeof data === "string" ? data : JSON.stringify(data, null, 2));
}

// API helper for backend-state proof (independent of the UI session)
const loginRes = await fetch(`${api}/api/v1/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@complivibe.io", password: "PhaseA-Rebuild-2026!" })
});
const { access_token } = await loginRes.json();
async function apiGet(path) {
  const r = await fetch(`${api}${path}`, {
    headers: { Authorization: `Bearer ${access_token}`, "X-Organization-ID": ORG }
  });
  return r.json();
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1512, height: 982 } });
const page = await ctx.newPage();
const consoleErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => consoleErrors.push("PAGEERROR: " + e.message));

// Track reloads: any full navigation after initial page load fails the no-reload requirement.
let navCount = 0;
const navLog = [];
page.on("framenavigated", (f) => {
  if (f === page.mainFrame()) {
    navCount += 1;
    navLog.push(f.url());
  }
});

await page.goto(`${base}/login`, { waitUntil: "networkidle" });
await page.fill('input[type="email"]', "admin@complivibe.io");
await page.fill('input[type="password"]', "PhaseA-Rebuild-2026!");
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard**", { timeout: 20000 });

await page.goto(`${base}/dashboard/audit-pack`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const navBaseline = navCount;
// Stamp the JS context: if any step causes a real reload, this disappears.
await page.evaluate(() => { window.__sa6_no_reload_stamp = "alive"; });
await page.screenshot({ path: `${outDir}/01-initial.png`, fullPage: true });

const ts = new Date().toISOString().slice(0, 16).replace("T", " ");
const engTitle = `ISO 27001 surveillance audit — UI verify ${ts}`;
const findingTitle = `Access reviews missing for prod DB — UI verify ${ts}`;
const pbcTitle = `Q2 access review sign-off — UI verify ${ts}`;

// ── 1. Create engagement through the UI ─────────────────────────────────────
await page.click('[data-testid="open-engagement-modal"]');
await page.fill("#eng-title", engTitle);
await page.selectOption("#eng-type", "surveillance");
await page.fill("#eng-start", "2026-07-20");
await page.fill("#eng-end", "2026-08-28");
await page.fill("#eng-lead", "R. Menon");
await page.fill("#eng-firm", "Sentinel Assurance LLP");
await page.screenshot({ path: `${outDir}/02-engagement-form.png`, fullPage: true });
await page.click('button:has-text("Create engagement")');
await page.waitForSelector(`text=${engTitle}`, { timeout: 15000 });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${outDir}/03-engagement-created.png`, fullPage: true });

const engs = await apiGet("/api/v1/compliance/audit-engagements");
const eng = engs.find((e) => e.title === engTitle);
if (!eng) throw new Error("Engagement not found in backend after UI create");
log("engagement created (API GET proof)", eng);

// Workspace should be auto-selected after create
await page.waitForSelector('[data-testid="engagement-workspace"]', { timeout: 10000 });

// ── 2. Create finding through the UI ────────────────────────────────────────
await page.click('[data-testid="open-finding-modal"]');
await page.fill("#finding-title", findingTitle);
await page.selectOption("#finding-severity", "high");
await page.fill("#finding-framework", "ISO 27001 A.9.2.5");
await page.fill("#finding-description", "Quarterly access reviews for the production database were not performed in Q1 or Q2.");
// wait for org users to load into the owner select
await page.waitForFunction(() => document.querySelectorAll("#finding-owner option").length > 1, { timeout: 10000 });
await page.selectOption("#finding-owner", { index: 1 });
await page.fill("#finding-target", "2026-09-15");
await page.fill("#finding-remediation", "Run and document access reviews for Q1/Q2 retroactively; add recurring calendar control.");
await page.screenshot({ path: `${outDir}/04-finding-form.png`, fullPage: true });
await page.click('button:has-text("Record finding")');
await page.waitForSelector(`text=${findingTitle}`, { timeout: 15000 });
await page.waitForTimeout(800);
await page.screenshot({ path: `${outDir}/05-finding-created.png`, fullPage: true });

let findings = await apiGet(`/api/v1/compliance/audit-findings/engagement/${eng.id}`);
const finding = findings.find((f) => f.title === findingTitle);
if (!finding) throw new Error("Finding not found in backend after UI create");
log("finding created (API GET proof)", finding);

// ── 3. Transition finding open -> in_remediation through the UI ─────────────
await page.click('[data-testid="finding-transition-in_remediation"]');
await page.waitForSelector('[data-testid="engagement-workspace"] :text("in remediation")', { timeout: 10000 });
await page.waitForTimeout(800);
findings = await apiGet(`/api/v1/compliance/audit-findings/engagement/${eng.id}`);
log("finding transitioned (API GET proof)", { id: findings[0]?.id, status: findings.find((f) => f.id === finding.id)?.status });
await page.screenshot({ path: `${outDir}/06-finding-transitioned.png`, fullPage: true });

// ── 4. Create PBC item through the UI ───────────────────────────────────────
await page.click('[data-testid="open-pbc-modal"]');
await page.fill("#pbc-title", pbcTitle);
await page.fill("#pbc-description", "Signed quarterly access review covering production systems, PDF export.");
await page.fill("#pbc-due", "2026-08-10");
await page.screenshot({ path: `${outDir}/07-pbc-form.png`, fullPage: true });
await page.click('button:has-text("Create request")');
await page.waitForSelector(`text=${pbcTitle}`, { timeout: 15000 });
await page.waitForTimeout(800);
let pbcs = await apiGet(`/api/v1/compliance/pbc-items/engagement/${eng.id}`);
const pbc = pbcs.find((p) => p.title === pbcTitle);
if (!pbc) throw new Error("PBC item not found in backend after UI create");
log("pbc item created (API GET proof)", pbc);
await page.screenshot({ path: `${outDir}/08-pbc-created.png`, fullPage: true });

// ── 5. PBC transition pending -> submitted through the UI ───────────────────
await page.click('[data-testid="pbc-action-submit"]');
await page.waitForSelector('button:has-text("Submit item")', { timeout: 5000 });
await page.screenshot({ path: `${outDir}/09-pbc-submit-modal.png`, fullPage: true });
await page.click('button:has-text("Submit item")');
await page.waitForTimeout(1500);
pbcs = await apiGet(`/api/v1/compliance/pbc-items/engagement/${eng.id}`);
log("pbc submitted (API GET proof)", { id: pbc.id, status: pbcs.find((p) => p.id === pbc.id)?.status });
await page.screenshot({ path: `${outDir}/10-pbc-submitted.png`, fullPage: true });

// ── 6. PBC transition submitted -> accepted (no evidence => override) ───────
await page.click('[data-testid="pbc-action-accept"]');
await page.waitForSelector("#pbc-override", { timeout: 5000 });
// First try WITHOUT a reason to prove the backend guard surfaces in the UI
await page.click('button:has-text("Accept item")');
await page.waitForSelector("text=Cannot accept a PBC item with no evidence", { timeout: 10000 });
await page.screenshot({ path: `${outDir}/11-pbc-accept-guard.png`, fullPage: true });
await page.fill("#pbc-override", "Reviewed the signed report directly during fieldwork walkthrough; formal upload to evidence vault to follow.");
await page.click('button:has-text("Accept item")');
await page.waitForTimeout(1500);
pbcs = await apiGet(`/api/v1/compliance/pbc-items/engagement/${eng.id}`);
const acceptedPbc = pbcs.find((p) => p.id === pbc.id);
log("pbc accepted (API GET proof)", { id: pbc.id, status: acceptedPbc?.status, override: acceptedPbc?.acceptance_override_reason });
await page.screenshot({ path: `${outDir}/12-pbc-accepted.png`, fullPage: true });

// ── 7. Engagement transition planning -> fieldwork through the UI ───────────
await page.click('[data-testid="engagement-transition-fieldwork"]');
await page.waitForTimeout(1500);
const engAfter = (await apiGet("/api/v1/compliance/audit-engagements")).find((e) => e.id === eng.id);
log("engagement transitioned (API GET proof)", { id: eng.id, status: engAfter?.status });
await page.screenshot({ path: `${outDir}/13-engagement-fieldwork.png`, fullPage: true });

// ── Verdict ──────────────────────────────────────────────────────────────────
// framenavigated also fires for same-document history updates (Next.js router
// replaceState), so the authoritative no-reload proof is the JS-context stamp:
// it survives soft updates but is destroyed by any real page load.
const stampAlive = await page.evaluate(() => window.__sa6_no_reload_stamp === "alive");
log("no-reload check", { jsContextStampSurvived: stampAlive, framenavigatedEvents: navCount - navBaseline, urls: navLog });
// The accept-guard step DELIBERATELY provokes one 422 (accept with no evidence and
// no override) to prove the backend rule surfaces in the UI; the browser logs that
// failed fetch as a console error. It is expected — everything else must be zero.
const expected422 = /the server responded with a status of 422/;
const unexpectedErrors = consoleErrors.filter((e, i) => !(expected422.test(e) && consoleErrors.findIndex((x) => expected422.test(x)) === i));
log("console errors (raw)", consoleErrors);
log("console errors (unexpected)", unexpectedErrors);

const pass =
  Boolean(eng) &&
  finding.status === "open" &&
  findings.find((f) => f.id === finding.id)?.status === "in_remediation" &&
  acceptedPbc?.status === "accepted" &&
  engAfter?.status === "fieldwork" &&
  stampAlive &&
  unexpectedErrors.length === 0;

fs.writeFileSync(`${outDir}/evidence.json`, JSON.stringify(evidence, null, 2));
console.log(`\nVERDICT: ${pass ? "PASS" : "FAIL"}`);
await browser.close();
process.exit(pass ? 0 : 1);
