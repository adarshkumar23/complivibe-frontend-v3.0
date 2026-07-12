// Part 2: new-version, cancel-request, deprecate, archive — driven through the real UI.
// Operates on the two policies created by verify-policies.mjs (pass their ids as args).
import { chromium } from "playwright";
import fs from "node:fs";

const base = "http://127.0.0.1:3777";
const api = "http://127.0.0.1:8123";
const ORG = "3f663d8b-0d8a-439c-b5b5-be0f94198fe2";
const OUT = "reports/completion-pass/sa1-policies";
fs.mkdirSync(OUT, { recursive: true });

const APPROVED_ID = process.argv[2]; // approved lifecycle policy
const REJECTED_ID = process.argv[3]; // template policy with rejected version

const evidence = [];
function log(...a) {
  console.log(...a);
  evidence.push(a.join(" "));
}

async function apiLogin(email, password) {
  const r = await fetch(`${api}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return (await r.json()).access_token;
}
async function apiGet(tok, path) {
  const r = await fetch(`${api}${path}`, {
    headers: { Authorization: `Bearer ${tok}`, "X-Organization-ID": ORG }
  });
  return r.json();
}

const adminTok = await apiLogin("admin@complivibe.io", "PhaseA-Rebuild-2026!");

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1512, height: 982 } });
const page = await ctx.newPage();
const consoleErrors = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});
page.on("pageerror", (e) => consoleErrors.push("PAGEERROR: " + e.message));

async function selectByText(sel, text) {
  const value = await page.$eval(
    sel,
    (el, t) => Array.from(el.options).find((o) => o.textContent.includes(t))?.value,
    text
  );
  if (!value) throw new Error(`no option containing "${text}" in ${sel}`);
  await page.selectOption(sel, value);
}

await page.goto(`${base}/login`, { waitUntil: "networkidle" });
await page.fill('input[type="email"]', "admin@complivibe.io");
await page.fill('input[type="password"]', "PhaseA-Rebuild-2026!");
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard**", { timeout: 20000 });
await page.goto(`${base}/dashboard/policies`, { waitUntil: "domcontentloaded" });
await page.waitForSelector(`[data-testid="policy-row-${REJECTED_ID}"]`, { timeout: 20000 });

// ── 1. NEW VERSION on the rejected-template policy ──────────────────────────
await page.click(`[data-testid="policy-row-${REJECTED_ID}"]`);
await page.waitForSelector('[data-testid="toggle-new-version"]', { timeout: 15000 });
await page.click('[data-testid="toggle-new-version"]');
await page.waitForSelector('[data-testid="new-version-form"]');
await page.fill("#new-version-number", "1.1");
await page.fill(
  "#new-version-content",
  "## Purpose\nRevised after review feedback.\n\n## Scope\nOrg-specific scope detail added per reviewer notes."
);
await page.fill("#new-version-summary", "Addressed reviewer feedback on scope");
await page.click('[data-testid="create-version"]');
// version list should show v1.1 without reload
await page.waitForFunction(
  () => document.querySelector('[data-testid="version-history"]')?.textContent?.includes("v1.1"),
  { timeout: 15000 }
);
log("NEW VERSION: v1.1 visible in history without reload:", true);
await page.screenshot({ path: `${OUT}/09-new-version.png` });
const vers = await apiGet(adminTok, `/api/v1/compliance/policies/${REJECTED_ID}/versions`);
const v11 = vers.find((v) => v.version_number === "1.1");
log("NEW VERSION: backend v1.1:", v11?.status, "summary:", JSON.stringify(v11?.change_summary));

// ── 2. RESUBMIT v1.1 then CANCEL the request ────────────────────────────────
await page.waitForSelector('[data-testid="send-for-review"]', { timeout: 15000 });
await page.selectOption("#submit-version", v11.id);
await selectByText("#submit-approver", "Rhea Kapoor");
await page.click('[data-testid="submit-for-review"]');
await page.waitForSelector('[data-testid="pending-request"]', { timeout: 15000 });
await page.fill("#cancel-reason", "Withdrawing — additional legal input needed first.");
await page.click('[data-testid="cancel-request"]');
await page.waitForSelector('[data-testid="pending-request"]', { state: "detached", timeout: 15000 });
log("CANCEL: pending request cleared from modal without reload:", true);
await page.screenshot({ path: `${OUT}/10-cancelled-request.png` });
const reqs = await apiGet(adminTok, `/api/v1/compliance/policies/${REJECTED_ID}/approval-requests`);
const cancelled = reqs.find((r) => r.status === "cancelled");
log("CANCEL: backend request status:", cancelled?.status, "notes:", JSON.stringify(cancelled?.notes));

// ── 3. DEPRECATE then ARCHIVE the approved policy ───────────────────────────
await page.keyboard.press("Escape");
await page.click(`[data-testid="policy-row-${APPROVED_ID}"]`);
await page.waitForSelector('[data-testid="deprecate-policy"]', { timeout: 15000 });
await page.click('[data-testid="deprecate-policy"]');
await page.waitForSelector('[data-testid="archive-policy"]', { timeout: 15000 });
log("DEPRECATE: archive controls appeared without reload:", true);
const dep = await apiGet(adminTok, `/api/v1/compliance/policies/${APPROVED_ID}`);
log("DEPRECATE: backend policy status:", dep.status);
await page.screenshot({ path: `${OUT}/11-deprecated.png` });

await page.fill("#archive-reason", "Superseded by the 2026 information security policy set.");
await page.click('[data-testid="archive-policy"]');
// modal closes and the policy leaves the default library list
await page.waitForSelector(`[data-testid="policy-row-${APPROVED_ID}"]`, { state: "detached", timeout: 15000 });
log("ARCHIVE: policy removed from library without reload:", true);
await page.screenshot({ path: `${OUT}/12-archived-library.png`, fullPage: true });
const arch = await apiGet(adminTok, `/api/v1/compliance/policies/${APPROVED_ID}`);
log("ARCHIVE: backend policy:", arch.status, "reason:", JSON.stringify(arch.archive_reason));

log("console errors:", JSON.stringify(consoleErrors));
fs.appendFileSync(`${OUT}/evidence.txt`, evidence.join("\n") + "\n");
await browser.close();
