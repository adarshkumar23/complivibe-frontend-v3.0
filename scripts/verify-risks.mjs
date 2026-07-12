/**
 * SA-2 live verification: risk CREATE via UI form, matrix live update without
 * reload, risk EDIT (likelihood/impact/status) via the interactive matrix,
 * backend confirmation via API GET, and matrix cell movement.
 */
import { chromium } from "playwright";
import fs from "node:fs";

const base = "http://127.0.0.1:3777";
const api = "http://127.0.0.1:8123";
const ORG = "3f663d8b-0d8a-439c-b5b5-be0f94198fe2";
const outDir = "reports/completion-pass/sa2-risks";
fs.mkdirSync(outDir, { recursive: true });
const evidence = { steps: [] };
const log = (name, data) => {
  evidence.steps.push({ name, data });
  console.log(`[${name}]`, typeof data === "string" ? data : JSON.stringify(data).slice(0, 400));
};

// Direct API access for backend-state confirmation
const loginRes = await fetch(`${api}/api/v1/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@complivibe.io", password: "PhaseA-Rebuild-2026!" })
});
const { access_token } = await loginRes.json();
const apiGet = async (path) => {
  const r = await fetch(`${api}${path}`, {
    headers: { Authorization: `Bearer ${access_token}`, "X-Organization-ID": ORG }
  });
  return { status: r.status, body: await r.json() };
};

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

await page.goto(`${base}/dashboard/risks`, { waitUntil: "domcontentloaded" });
await page.waitForSelector("text=Risk Register", { timeout: 20000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: `${outDir}/01-risks-page-before.png`, fullPage: true });

const stamp = Date.now().toString().slice(-6);
const title = `UI-Verify ${stamp}: unpatched CVE backlog in build agents`;

// Baseline: L2×I2 cell should be empty, L5×I5 empty
const cellLabel = (l, i) => page.locator(`button[aria-label^="Likelihood ${l}, impact ${i}:"]`);
log("baseline cell 2-2", await cellLabel(2, 2).getAttribute("aria-label"));
log("baseline cell 5-5", await cellLabel(5, 5).getAttribute("aria-label"));

// ── CREATE via UI form ──────────────────────────────────────────────────────
await page.click('button:has-text("New Risk")');
const dialog = page.locator('[role="dialog"]');
await dialog.waitFor({ timeout: 5000 });
await dialog.locator("#risk-title").fill(title);
await dialog.locator("#risk-description").fill("Created live through the UI by the SA-2 verification run.");
await dialog.locator("#risk-category").selectOption("technology");
await dialog.locator("#risk-owner").selectOption({ label: "Phase A Admin" });
await dialog.getByRole("radiogroup", { name: "Likelihood" }).getByRole("radio", { name: "2", exact: true }).click();
await dialog.getByRole("radiogroup", { name: "Impact" }).getByRole("radio", { name: "2", exact: true }).click();
await dialog.locator("#risk-treatment").selectOption("mitigate");
await page.screenshot({ path: `${outDir}/02-create-form-filled.png` });
await dialog.locator('button[type="submit"]').click();
await dialog.waitFor({ state: "detached", timeout: 15000 });

// Register must show the new risk WITHOUT reload
await page.waitForSelector(`text=${title}`, { timeout: 15000 });
log("register shows new risk without reload", true);
// Matrix cell 2-2 must now report 1 risk (react-query invalidation, no reload)
await page.waitForFunction(
  () => {
    const b = document.querySelector('button[aria-label^="Likelihood 2, impact 2:"]');
    return b && /: 1 risk/.test(b.getAttribute("aria-label") || "");
  },
  { timeout: 15000 }
);
log("matrix cell 2-2 after create", await cellLabel(2, 2).getAttribute("aria-label"));
await page.screenshot({ path: `${outDir}/03-after-create-matrix-2x2.png`, fullPage: true });

// Backend confirmation
const created = await apiGet(`/api/v1/risks?limit=100`);
const mine = created.body.find((r) => r.title === title);
if (!mine) throw new Error("Created risk not found via API GET");
log("API GET after create", {
  id: mine.id, title: mine.title, category: mine.category, likelihood: mine.likelihood,
  impact: mine.impact, inherent_score: mine.inherent_score, status: mine.status,
  treatment_strategy: mine.treatment_strategy, owner_user_id: mine.owner_user_id
});

// ── EDIT via interactive matrix: L2×I2 → L5×I5, status → in_treatment ──────
await cellLabel(2, 2).click();
await page.waitForSelector(`text=L2 × I2`, { timeout: 5000 });
await page.screenshot({ path: `${outDir}/04-matrix-cell-selected.png` });
await page.click(`button:has-text("${title}")`);
await dialog.waitFor({ timeout: 5000 });
await dialog.getByRole("radiogroup", { name: "Likelihood" }).getByRole("radio", { name: "5", exact: true }).click();
await dialog.getByRole("radiogroup", { name: "Impact" }).getByRole("radio", { name: "5", exact: true }).click();
await dialog.locator("#risk-status").selectOption("in_treatment");
await page.screenshot({ path: `${outDir}/05-edit-form-from-matrix.png` });
await dialog.locator('button[type="submit"]').click();
await dialog.waitFor({ state: "detached", timeout: 15000 });

// Matrix must move the risk to 5-5 and empty 2-2, live, no reload
await page.waitForFunction(
  () => {
    const c55 = document.querySelector('button[aria-label^="Likelihood 5, impact 5:"]');
    const c22 = document.querySelector('button[aria-label^="Likelihood 2, impact 2:"]');
    return c55 && c22 &&
      /: 1 risk/.test(c55.getAttribute("aria-label") || "") &&
      /: 0 risks/.test(c22.getAttribute("aria-label") || "");
  },
  { timeout: 15000 }
);
log("matrix cell 2-2 after edit", await cellLabel(2, 2).getAttribute("aria-label"));
log("matrix cell 5-5 after edit", await cellLabel(5, 5).getAttribute("aria-label"));
await page.screenshot({ path: `${outDir}/06-after-edit-matrix-5x5.png`, fullPage: true });

// Backend confirmation of the PATCH
const detail = await apiGet(`/api/v1/risks/${mine.id}`);
log("API GET after edit", {
  status: detail.status,
  likelihood: detail.body.likelihood, impact: detail.body.impact,
  inherent_score: detail.body.inherent_score, risk_status: detail.body.status, severity: detail.body.severity
});
if (detail.body.likelihood !== 5 || detail.body.impact !== 5 || detail.body.status !== "in_treatment") {
  throw new Error("Backend state does not reflect the edit!");
}
const heat = await apiGet(`/api/v1/risks/heatmap`);
const c55 = heat.body.matrix.find((c) => c.likelihood === 5 && c.impact === 5);
log("API heatmap cell 5-5", { count: c55.count, risks: c55.risks.map((r) => r.title) });

log("console errors", consoleErrors);
fs.writeFileSync(`${outDir}/evidence.json`, JSON.stringify(evidence, null, 2));
console.log(consoleErrors.length === 0 ? "PASS: zero console errors" : "FAIL: console errors present");
await browser.close();
