import { chromium } from "playwright";
import fs from "node:fs";

const base = "http://127.0.0.1:3777";
const api = "http://127.0.0.1:8123";
const ORG = "3f663d8b-0d8a-439c-b5b5-be0f94198fe2";
const GDPR = "e35add62-500a-417a-8401-3aaa02e52f43";
const outDir = "reports/completion-pass/sa3-controls";
fs.mkdirSync(outDir, { recursive: true });

const stamp = Date.now();
const controlTitle = `SA3 TLS 1.2+ enforcement for data in transit (${stamp})`;

// ---- API helper (for backend-state confirmation only; mutations go through the UI) ----
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

const gapsBefore = (await apiGet("/api/v1/controls/gaps/summary")).body;
console.log("API gaps BEFORE:", JSON.stringify(gapsBefore));

// pick the uncovered GDPR obligation the UI flow will map (avoid GDPR-ART5, used in an earlier API dry run)
const matrix = (await apiGet(`/api/v1/reports/framework-coverage-matrix?framework_id=${GDPR}`)).body;
const uncovered = matrix.sections
  .flatMap((s) => s.obligations)
  .filter((o) => o.coverage_status === "uncovered" && o.reference !== "GDPR-ART5")
  .sort((a, b) => a.reference.localeCompare(b.reference));
const target = uncovered[0];
if (!target) throw new Error("No uncovered GDPR obligation available to map");
console.log("target obligation:", target.reference, target.obligation_id);

// ---- browser ----
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

await page.goto(`${base}/dashboard/controls`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(5000);

const kpiValue = async () => {
  return await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll("p"));
    const label = els.find((e) => /Obligations Without Controls/i.test(e.textContent || ""));
    const num = label?.parentElement?.querySelector("span");
    return num ? num.textContent : null;
  });
};
const beforeKpi = await kpiValue();
console.log("UI KPI (uncovered) BEFORE:", beforeKpi);
await page.screenshot({ path: `${outDir}/01-controls-page-before.png`, fullPage: true });

// ---- 1) CREATE a control through the UI ----
await page.click('button:has-text("New control")');
await page.waitForSelector('#control-title');
await page.fill('#control-title', controlTitle);
await page.fill('#control-code', `SA3-${stamp % 100000}`);
await page.selectOption('#control-type', "technical");
await page.selectOption('#control-criticality', "high");
await page.fill('#control-description', "Enforce TLS 1.2+ on all endpoints handling personal data.");
await page.screenshot({ path: `${outDir}/02-create-control-form.png`, fullPage: true });
await page.click('button:has-text("Create control")');
await page.waitForTimeout(2500);

// UI shows it without reload
const inRegister = await page.textContent("body");
console.log("UI register shows new control (no reload):", inRegister.includes(controlTitle));
await page.screenshot({ path: `${outDir}/03-control-created-in-register.png`, fullPage: true });

// API confirms
const controlsAfterCreate = (await apiGet(`/api/v1/controls?limit=200&search=${encodeURIComponent("SA3 TLS")}`)).body;
const created = controlsAfterCreate.find((c) => c.title === controlTitle);
console.log("API GET confirms control exists:", created ? created.id : "NOT FOUND");
if (!created) throw new Error("control not found via API after UI create");

// ---- 2) MAP via the coverage-gap flow ----
// select GDPR in the coverage gap panel
await page.selectOption('select[aria-label="Framework"]', GDPR);
await page.waitForTimeout(2500);
await page.screenshot({ path: `${outDir}/04-coverage-gaps-gdpr.png`, fullPage: true });

// click "Map control" on the target obligation row
const row = page.locator("li", { hasText: target.reference }).first();
await row.locator('button:has-text("Map control")').click();
await page.waitForSelector('#map-control');
// obligation should be preset — verify its reference is shown in the modal
const modalText = await page.locator('[role="dialog"]').textContent();
console.log("modal shows preset obligation:", modalText.includes(target.reference));
await page.selectOption('#map-control', created.id);
await page.selectOption('#map-type', "satisfies");
await page.fill('#map-rationale', "TLS enforcement satisfies this transparency/lawfulness safeguard requirement.");
await page.screenshot({ path: `${outDir}/05-map-modal-filled.png`, fullPage: true });
await page.locator('[role="dialog"] button[type="submit"]').click();
await page.waitForTimeout(3000);

// ---- 3) VERIFY ----
const mapped = (await apiGet(`/api/v1/obligations/${target.obligation_id}/controls`)).body;
const mappedOk = Array.isArray(mapped) && mapped.some((c) => c.id === created.id);
console.log("API GET obligation->controls contains new control:", mappedOk);

const gapsAfter = (await apiGet("/api/v1/controls/gaps/summary")).body;
console.log("API gaps AFTER:", JSON.stringify(gapsAfter));
console.log(
  "uncovered count moved:",
  gapsBefore.obligations_without_controls, "->", gapsAfter.obligations_without_controls
);

// UI reflects it WITHOUT reload (react-query invalidation)
await page.waitForTimeout(2500);
const afterKpi = await kpiValue();
console.log("UI KPI (uncovered) AFTER (no reload):", afterKpi);
const rowAfter = await page.locator("li", { hasText: target.reference }).first().textContent().catch(() => "(row filtered out)");
console.log("gap row after mapping:", JSON.stringify(rowAfter?.slice(0, 160)));
await page.screenshot({ path: `${outDir}/06-after-mapping-no-reload.png`, fullPage: true });

// ---- 4) LINK TO POLICY through the UI ----
const search = page.locator('input[placeholder*="Search controls"]');
await search.fill("SA3 TLS");
await page.waitForTimeout(800);
await page.locator("li", { hasText: controlTitle }).locator('button:has-text("Link policy")').click();
await page.waitForSelector('#link-policy');
const policies = (await apiGet("/api/v1/compliance/policies")).body;
const policy = policies.find((p) => p.title.includes("Information Security")) ?? policies[0];
await page.selectOption('#link-policy', policy.id);
await page.fill('#link-reason', "Control implements the encryption-in-transit requirement of this policy.");
await page.screenshot({ path: `${outDir}/07-link-policy-modal.png`, fullPage: true });
await page.locator('[role="dialog"] button:has-text("Link policy")').click();
await page.waitForTimeout(2500);

const links = (await apiGet(`/api/v1/compliance/policies/${policy.id}/links/controls`)).body;
const linkRows = Array.isArray(links) ? links : links.items ?? [];
const linkOk = linkRows.some((l) => l.control_id === created.id && l.status === "active");
console.log("API GET policy->control links contains new link:", linkOk, "(policy:", policy.title + ")");
await page.screenshot({ path: `${outDir}/08-after-policy-link.png`, fullPage: true });

console.log("console errors:", JSON.stringify(consoleErrors.slice(0, 10)));
await browser.close();
