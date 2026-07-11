import { chromium } from "playwright";
import fs from "node:fs";

const base = "http://127.0.0.1:3777";
const api = "http://127.0.0.1:8123";
const ORG = "3f663d8b-0d8a-439c-b5b5-be0f94198fe2";
const outDir = "reports/completion-pass/sa4-ai-systems";
fs.mkdirSync(outDir, { recursive: true });

const stamp = Date.now();
const assessmentTitle = `SA4 verify assessment ${stamp}`;
const systemName = `SA4 Verify Triage Agent ${stamp}`;
const evidence = { stamp, assessmentTitle, systemName };

// API session for follow-up GET verification
const loginRes = await fetch(`${api}/api/v1/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@complivibe.io", password: "PhaseA-Rebuild-2026!" })
});
const { access_token } = await loginRes.json();
const apiHeaders = { Authorization: `Bearer ${access_token}`, "X-Organization-ID": ORG };

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

// ─── Flow 1: create AI risk assessment on /dashboard/ai-testing ────────────
await page.goto(`${base}/dashboard/ai-testing`, { waitUntil: "domcontentloaded" });
await page.waitForSelector("text=AI Risk Assessments", { timeout: 20000 });
await page.waitForTimeout(2500);

const beforeBadge = await page.textContent("body").then((t) => (t.match(/(\d+) assessments/) || [])[1]);
evidence.assessmentsBadgeBefore = beforeBadge ?? null;
console.log("assessments badge before:", beforeBadge);

await page.click('button:has-text("New assessment")');
await page.waitForSelector("#assess-system", { timeout: 10000 });
await page.screenshot({ path: `${outDir}/01-assessment-modal-open.png` });

// pick a real seeded system by visible name
await page.waitForFunction(() => document.querySelectorAll("#assess-system option").length > 1, null, { timeout: 10000 });
const fraudValue = await page.$$eval("#assess-system option", (opts) => {
  const opt = opts.find((o) => (o.textContent || "").includes("Fraud Anomaly Detector"));
  return opt ? opt.value : null;
});
if (!fraudValue) throw new Error("Seeded system 'Fraud Anomaly Detector' not in dropdown");
evidence.selectedAiSystemId = fraudValue;
await page.selectOption("#assess-system", fraudValue);
await page.fill("#assess-title", assessmentTitle);
await page.selectOption("#assess-type", "pre_deployment");
await page.selectOption("#assess-risk", "medium");
await page.selectOption("#assess-likelihood", "medium");
await page.selectOption("#assess-impact", "high");
await page.fill("#assess-description", "Pre-deployment review created via SA4 live UI verification.");
await page.fill("#assess-mitigation", "Human review of flagged transactions before action.");
await page.screenshot({ path: `${outDir}/02-assessment-modal-filled.png` });
await page.click('button:has-text("Create assessment")');

// wait for the new row to appear WITHOUT reload
await page.waitForSelector(`text=${assessmentTitle}`, { timeout: 15000 });
await page.waitForTimeout(2000); // let summary/KPI invalidation settle
const afterBadge = await page.textContent("body").then((t) => (t.match(/(\d+) assessments/) || [])[1]);
evidence.assessmentsBadgeAfter = afterBadge ?? null;
console.log("assessments badge after (no reload):", afterBadge);
await page.screenshot({ path: `${outDir}/03-assessment-created-no-reload.png`, fullPage: true });

// backend confirmation
const assessGet = await fetch(`${api}/api/v1/ai-governance/ai-risk/assessments?limit=50`, { headers: apiHeaders });
const assessList = await assessGet.json();
const createdAssessment = assessList.find((a) => a.title === assessmentTitle);
evidence.assessmentBackend = createdAssessment ?? null;
console.log("backend has assessment:", Boolean(createdAssessment), createdAssessment?.id);
const summaryGet = await fetch(`${api}/api/v1/ai-governance/ai-risk/assessments/summary`, { headers: apiHeaders });
evidence.assessmentSummaryAfter = await summaryGet.json();
console.log("summary total after:", evidence.assessmentSummaryAfter.total_assessments);

// ─── Flow 2: register AI system on /dashboard/ai-systems ───────────────────
await page.goto(`${base}/dashboard/ai-systems`, { waitUntil: "domcontentloaded" });
await page.waitForSelector("text=AI System Registry", { timeout: 20000 });
await page.waitForTimeout(2500);
const beforeSystems = await page.textContent("body").then((t) => (t.match(/(\d+) systems/) || [])[1]);
evidence.systemsBadgeBefore = beforeSystems ?? null;
console.log("systems badge before:", beforeSystems);

await page.click('button:has-text("Register system")');
await page.waitForSelector("#sys-name", { timeout: 10000 });
await page.fill("#sys-name", systemName);
await page.selectOption("#sys-type", "agent");
await page.selectOption("#sys-lifecycle", "in_development");
await page.fill("#sys-model", "triage-agent");
await page.fill("#sys-model-version", "0.1.0");
await page.fill("#sys-env", "aws-ap-south-1");
await page.fill("#sys-purpose", "Routes inbound support tickets to the right queue.");
await page.screenshot({ path: `${outDir}/04-system-modal-filled.png` });
await page.click('button:has-text("Register system") >> nth=1'); // submit inside the modal
await page.waitForSelector(`text=${systemName}`, { timeout: 15000 });
await page.waitForTimeout(2000);
const afterSystems = await page.textContent("body").then((t) => (t.match(/(\d+) systems/) || [])[1]);
evidence.systemsBadgeAfter = afterSystems ?? null;
console.log("systems badge after (no reload):", afterSystems);
await page.screenshot({ path: `${outDir}/05-system-created-no-reload.png`, fullPage: true });

// ─── Flow 3: edit that system (lifecycle in_development -> testing) ─────────
await page.click(`button[aria-label="Edit ${systemName}"]`);
await page.waitForSelector("#sys-name", { timeout: 10000 });
const prefilled = await page.inputValue("#sys-name");
console.log("edit prefilled name ok:", prefilled === systemName);
await page.selectOption("#sys-lifecycle", "testing");
await page.click('button:has-text("Save changes")');
await page.waitForTimeout(2500);
const rowText = await page.evaluate((name) => {
  const li = Array.from(document.querySelectorAll("li")).find((el) => el.textContent.includes(name));
  return li ? li.textContent : null;
}, systemName);
evidence.editedRowText = rowText;
console.log("edited row shows testing (no reload):", rowText?.includes("testing"));
await page.screenshot({ path: `${outDir}/06-system-edited-no-reload.png`, fullPage: true });

// backend confirmation for system create+edit
const sysGet = await fetch(`${api}/api/v1/ai-systems?search=${encodeURIComponent("SA4 Verify")}`, { headers: apiHeaders });
const sysList = await sysGet.json();
const createdSystem = sysList.find((s) => s.name === systemName);
evidence.systemBackend = createdSystem ?? null;
console.log("backend has system:", Boolean(createdSystem), "lifecycle:", createdSystem?.lifecycle_status);

evidence.consoleErrors = consoleErrors;
fs.writeFileSync(`${outDir}/evidence.json`, JSON.stringify(evidence, null, 2));
console.log("console errors:", JSON.stringify(consoleErrors));
await browser.close();
