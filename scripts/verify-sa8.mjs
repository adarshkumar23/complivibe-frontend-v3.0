import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";

const base = "http://127.0.0.1:3777";
const api = "http://127.0.0.1:8123";
const ORG = "3f663d8b-0d8a-439c-b5b5-be0f94198fe2";
const OUT = "reports/completion-pass/sa8-small-domains";
mkdirSync(OUT, { recursive: true });

const only = process.argv[2] || "all"; // legal|billing|security|enterprise|employee|all
const stamp = Date.now().toString().slice(-6);

// ── API helper for GET-proof ────────────────────────────────────────────────
const login = await fetch(`${api}/api/v1/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@complivibe.io", password: "PhaseA-Rebuild-2026!" })
});
const TOK = (await login.json()).access_token;
async function apiGet(path) {
  const r = await fetch(`${api}${path}`, {
    headers: { Authorization: `Bearer ${TOK}`, "X-Organization-ID": ORG }
  });
  return { status: r.status, body: await r.json() };
}
function save(name, data) {
  writeFileSync(`${OUT}/${name}`, JSON.stringify(data, null, 2));
}

// ── Browser session ─────────────────────────────────────────────────────────
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

async function openPage(path) {
  await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3500);
  // No-reload marker: must survive until end of the domain's flow.
  await page.evaluate(() => { window.__noReload = "intact"; });
}
async function assertNoReload(label) {
  const v = await page.evaluate(() => window.__noReload);
  console.log(`${label}: no-reload marker ${v === "intact" ? "INTACT (no page reload)" : "LOST — PAGE RELOADED!"}`);
}
async function bodyHas(text) {
  const b = await page.textContent("body");
  return b.includes(text);
}
const results = [];
function report(label, ok, extra = "") {
  results.push({ label, ok, extra });
  console.log(`${ok ? "PASS" : "FAIL"} — ${label}${extra ? " — " + extra : ""}`);
}

// ── 1. LEGAL ────────────────────────────────────────────────────────────────
if (only === "all" || only === "legal") {
  await openPage("/dashboard/legal");
  await page.screenshot({ path: `${OUT}/legal-before.png`, fullPage: true });

  // Create legal matter
  const matterTitle = `Vendor DPA dispute — Acme SaaS ${stamp}`;
  await page.getByRole("button", { name: "New matter" }).click();
  await page.fill("#lm-title", matterTitle);
  await page.selectOption("#lm-type", "contract_dispute");
  await page.fill("#lm-opposing", "Acme Corp");
  await page.fill("#lm-counsel", "Khaitan & Co");
  await page.fill("#lm-budget", "250000");
  await page.fill("#lm-desc", "Dispute over data-processing addendum breach remedies.");
  await page.getByRole("button", { name: "Open matter" }).click();
  await page.waitForTimeout(2500);
  report("legal: matter visible in table without reload", await bodyHas(matterTitle));
  await assertNoReload("legal");

  const matters = await apiGet("/api/v1/legal-matters");
  const found = (matters.body || []).find((m) => m.title === matterTitle);
  save("legal-matter-api-proof.json", { request: "GET /api/v1/legal-matters", matched: found ?? null });
  report("legal: matter exists in backend", Boolean(found), found?.id);

  // Whistleblower submission
  await page.getByRole("button", { name: "Submit report" }).click();
  await page.selectOption("#wb-category", "data_privacy");
  await page.fill("#wb-desc", `Observed customer PII exported to a personal drive without approval. (verify ${stamp})`);
  await page.getByRole("button", { name: "Submit report" }).last().click();
  await page.waitForTimeout(2500);
  const trackingShown = await bodyHas("Report filed anonymously");
  const trackingCode = trackingShown
    ? await page.evaluate(() => document.querySelector("code")?.textContent ?? null)
    : null;
  report("legal: tracking code shown once", Boolean(trackingCode), trackingCode ?? "");
  await page.getByRole("button", { name: "Done" }).click();
  await page.waitForTimeout(2000);
  report("legal: report row appears in panel without reload", await bodyHas("data privacy"));
  await assertNoReload("legal");

  const reports_ = await apiGet("/api/v1/whistleblower/reports");
  const rep = (reports_.body || []).find((r) => (r.description || "").includes(`verify ${stamp}`));
  save("legal-wb-api-proof.json", { request: "GET /api/v1/whistleblower/reports", matched: rep ?? null, tracking_code_shown: trackingCode });
  report("legal: whistleblower report exists in backend", Boolean(rep), rep?.id);
  await page.screenshot({ path: `${OUT}/legal-after.png`, fullPage: true });
}

// ── 2. BILLING / ESG ────────────────────────────────────────────────────────
if (only === "all" || only === "billing") {
  await openPage("/dashboard/billing");
  await page.screenshot({ path: `${OUT}/billing-before.png`, fullPage: true });

  // Spend cap
  await page.getByRole("button", { name: "Spend cap" }).click();
  await page.waitForTimeout(400);
  const checkbox = page.locator('input[type="checkbox"]');
  if (!(await checkbox.isChecked())) await checkbox.check();
  await page.fill("#cap-amount", "50000");
  await page.getByRole("button", { name: "Save cap" }).click();
  await page.waitForTimeout(2500);
  report("billing: KPI caption shows cap without reload", await bodyHas("cap ₹50000"));
  await assertNoReload("billing");
  const usage = await apiGet("/api/v1/billing/usage/dashboard");
  save("billing-spendcap-api-proof.json", { request: "GET /api/v1/billing/usage/dashboard", usage_spend_cap_enabled: usage.body.usage_spend_cap_enabled, usage_spend_cap_inr: usage.body.usage_spend_cap_inr });
  report("billing: cap persisted in backend", usage.body.usage_spend_cap_enabled === true && Number(usage.body.usage_spend_cap_inr) === 50000);

  // Carbon reading (scope3 to exercise category select)
  const before = await apiGet("/api/v1/carbon-accounting/dashboard");
  await page.getByRole("button", { name: "Record emissions" }).click();
  await page.selectOption("#cr-scope", "scope3");
  await page.selectOption("#cr-cat", "business_travel");
  await page.fill("#cr-source", "corporate_travel_agency");
  await page.fill("#cr-start", "2026-06-01");
  await page.fill("#cr-end", "2026-06-30");
  await page.fill("#cr-value", "3.2");
  await page.selectOption("#cr-unit", "tCO2e");
  await page.getByRole("button", { name: "Record reading" }).click();
  await page.waitForTimeout(2500);
  report("billing: scope3 total visible in Carbon panel without reload", await bodyHas("scope3"));
  await assertNoReload("billing");
  const after = await apiGet("/api/v1/carbon-accounting/dashboard");
  save("billing-carbon-api-proof.json", { request: "GET /api/v1/carbon-accounting/dashboard", before: before.body, after: after.body });
  report("billing: reading count incremented in backend", after.body.reading_count === before.body.reading_count + 1, `${before.body.reading_count} -> ${after.body.reading_count}`);
  await page.screenshot({ path: `${OUT}/billing-after.png`, fullPage: true });
}

// ── 3. SECURITY ─────────────────────────────────────────────────────────────
if (only === "all" || only === "security") {
  await openPage("/dashboard/security");
  await page.screenshot({ path: `${OUT}/security-before.png`, fullPage: true });

  const nhiName = `ci-deploy-bot-${stamp}`;
  await page.getByRole("button", { name: "Register" }).click();
  await page.fill("#nhi-name", nhiName);
  await page.selectOption("#nhi-type", "service_account");
  await page.selectOption("#nhi-owner", { label: "Phase A Admin" });
  await page.fill("#nhi-env", "production");
  await page.selectOption("#nhi-risk", "medium");
  await page.fill("#nhi-desc", "CI service account used for production deploys.");
  await page.getByRole("button", { name: "Register identity" }).click();
  await page.waitForTimeout(2500);
  report("security: identity visible in panel without reload", await bodyHas(nhiName));
  await assertNoReload("security");
  const nhis = await apiGet("/api/v1/non-human-identities");
  const nhi = (nhis.body || []).find((i) => i.name === nhiName);
  save("security-nhi-api-proof.json", { request: "GET /api/v1/non-human-identities", matched: nhi ?? null });
  report("security: identity exists in backend", Boolean(nhi), nhi?.id);
  await page.screenshot({ path: `${OUT}/security-after.png`, fullPage: true });
}

// ── 4. ENTERPRISE ───────────────────────────────────────────────────────────
if (only === "all" || only === "enterprise") {
  await openPage("/dashboard/enterprise");
  await page.screenshot({ path: `${OUT}/enterprise-before.png`, fullPage: true });

  const buName = `India Engineering ${stamp}`;
  await page.getByRole("button", { name: "New unit" }).click();
  await page.fill("#bu-name", buName);
  await page.fill("#bu-code", `IN-ENG-${stamp}`);
  await page.fill("#bu-desc", "Engineering org in India.");
  await page.getByRole("button", { name: "Create unit" }).click();
  await page.waitForTimeout(2500);
  report("enterprise: BU visible in panel without reload", await bodyHas(buName));
  await assertNoReload("enterprise");
  const bus = await apiGet("/api/v1/compliance/business-units");
  const bu = (bus.body || []).find((b) => b.name === buName);
  save("enterprise-bu-api-proof.json", { request: "GET /api/v1/compliance/business-units", matched: bu ?? null });
  report("enterprise: BU exists in backend", Boolean(bu), bu?.id);

  const campName = `Q3 2026 production access review ${stamp}`;
  await page.getByRole("button", { name: "New campaign" }).click();
  await page.fill("#ac-name", campName);
  await page.fill("#ac-due", "2026-09-30");
  await page.selectOption("#ac-status", "active");
  await page.fill("#ac-desc", "Quarterly review of production system access.");
  await page.getByRole("button", { name: "Create campaign" }).click();
  await page.waitForTimeout(2500);
  report("enterprise: campaign visible in panel without reload", await bodyHas(campName));
  await assertNoReload("enterprise");
  const camps = await apiGet("/api/v1/access-certifications/campaigns");
  const camp = (camps.body || []).find((c) => c.name === campName);
  save("enterprise-accesscert-api-proof.json", { request: "GET /api/v1/access-certifications/campaigns", matched: camp ?? null });
  report("enterprise: campaign exists in backend", Boolean(camp), camp?.id);
  await page.screenshot({ path: `${OUT}/enterprise-after.png`, fullPage: true });
}

// ── 5. EMPLOYEE COMPLIANCE ──────────────────────────────────────────────────
if (only === "all" || only === "employee") {
  await openPage("/dashboard/employee-compliance");
  await page.screenshot({ path: `${OUT}/employee-before.png`, fullPage: true });

  const trainingType = `security_awareness_${stamp}`;
  await page.getByRole("button", { name: "Assign training" }).first().click();
  await page.waitForTimeout(800);
  await page.selectOption("#tr-user", { label: "Phase A Admin" });
  await page.fill("#tr-type", trainingType);
  await page.fill("#tr-due", "2026-08-31");
  await page.getByRole("button", { name: "Assign training" }).last().click();
  await page.waitForTimeout(2500);
  report("employee: training record visible without reload", await bodyHas(trainingType.replaceAll("_", " ")));
  await assertNoReload("employee");
  const recs = await apiGet("/api/v1/training-analytics/records");
  const rec = (recs.body || []).find((r) => r.training_type === trainingType);
  save("employee-training-api-proof.json", { request: "GET /api/v1/training-analytics/records", matched: rec ?? null });
  report("employee: training record exists in backend", Boolean(rec), rec?.id);

  const campTitle = `AI acceptable-use attestation ${stamp}`;
  await page.getByRole("button", { name: "New campaign" }).click();
  await page.waitForTimeout(1200);
  await page.selectOption("#atc-policy", { label: "Acceptable Use of AI Tools (active)" }).catch(async () => {
    // fall back to first real policy option
    const val = await page.$eval("#atc-policy option:nth-child(2)", (o) => o.value);
    await page.selectOption("#atc-policy", val);
  });
  await page.fill("#atc-title", campTitle);
  await page.fill("#atc-due", "2026-08-15");
  await page.fill("#atc-text", "I have read and will comply with this policy.");
  await page.getByRole("button", { name: "Launch campaign" }).click();
  await page.waitForTimeout(2500);
  report("employee: campaign visible without reload", await bodyHas(campTitle));
  await assertNoReload("employee");
  const camps2 = await apiGet("/api/v1/compliance/attestation-campaigns");
  const list2 = Array.isArray(camps2.body) ? camps2.body : camps2.body?.items ?? [];
  const camp2 = list2.find((c) => c.title === campTitle);
  save("employee-attestation-api-proof.json", { request: "GET /api/v1/compliance/attestation-campaigns", matched: camp2 ?? null });
  report("employee: attestation campaign exists in backend", Boolean(camp2), camp2?.id);
  await page.screenshot({ path: `${OUT}/employee-after.png`, fullPage: true });
}

console.log("\nconsole errors:", JSON.stringify(consoleErrors.slice(0, 10)));
console.log("SUMMARY:", results.filter((r) => r.ok).length, "pass /", results.length);
if (results.some((r) => !r.ok) || consoleErrors.length) process.exitCode = 1;
await browser.close();
