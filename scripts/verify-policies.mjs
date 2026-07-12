import { chromium } from "playwright";
import fs from "node:fs";

const base = "http://127.0.0.1:3777";
const api = "http://127.0.0.1:8123";
const ORG = "3f663d8b-0d8a-439c-b5b5-be0f94198fe2";
const OUT = "reports/completion-pass/sa1-policies";
fs.mkdirSync(OUT, { recursive: true });

const stamp = Date.now().toString().slice(-6);
const TITLE = `UI Lifecycle Policy ${stamp}`;
const TEMPLATE_TITLE = `UI Template Policy ${stamp}`;

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
  const j = await r.json();
  return j.access_token;
}
async function apiGet(tok, path) {
  const r = await fetch(`${api}${path}`, {
    headers: { Authorization: `Bearer ${tok}`, "X-Organization-ID": ORG }
  });
  return r.json();
}

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

async function uiLogin(email, password) {
  // Session lives in an httpOnly cookie now -- page JS can't clear it (that's the point),
  // so force a clean logout via the browser-context cookie jar instead of localStorage.
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await ctx.clearCookies();
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard**", { timeout: 20000 });
}

const adminTok = await apiLogin("admin@complivibe.io", "PhaseA-Rebuild-2026!");

// ── 1. CREATE (blank form) as admin ─────────────────────────────────────────
await uiLogin("admin@complivibe.io", "PhaseA-Rebuild-2026!");
await page.goto(`${base}/dashboard/policies`, { waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-testid="new-policy"]', { timeout: 20000 });
await page.waitForTimeout(2500);

await page.click('[data-testid="new-policy"]');
await page.waitForSelector('[data-testid="policy-form"]');
await page.fill("#policy-title", TITLE);
await page.selectOption("#policy-type", "information_security");
await selectByText("#policy-owner", "Phase A Admin");
await page.fill("#policy-description", "End-to-end UI verification of the policy lifecycle.");
await page.fill(
  "#policy-content",
  "## Purpose\nVerify the full create-review-approve lifecycle through the real UI.\n\n## Scope\nApplies to the sa1-policies completion-pass verification run."
);
await page.screenshot({ path: `${OUT}/01-create-form.png` });
await page.click('[data-testid="policy-form-submit"]');
await page.waitForSelector('[data-testid="policy-form"]', { state: "detached", timeout: 15000 });
// UI must show the new policy WITHOUT reload
await page.waitForSelector(`text=${TITLE}`, { timeout: 15000 });
log("CREATE: new policy visible in library without reload:", true);
await page.screenshot({ path: `${OUT}/02-library-after-create.png`, fullPage: true });

const policies = await apiGet(adminTok, "/api/v1/compliance/policies");
const created = policies.find((p) => p.title === TITLE);
log("CREATE: backend GET status:", created?.status, "id:", created?.id);
const versions1 = await apiGet(adminTok, `/api/v1/compliance/policies/${created.id}/versions`);
log("CREATE: backend version:", versions1[0]?.version_number, versions1[0]?.status);

// ── 2. SUBMIT FOR REVIEW as admin (approver = Rhea) ─────────────────────────
await page.click(`[data-testid="policy-row-${created.id}"]`);
await page.waitForSelector('[data-testid="send-for-review"]', { timeout: 15000 });
await page.selectOption("#submit-version", versions1[0].id);
await selectByText("#submit-approver", "Rhea Kapoor");
await page.fill("#submit-notes", "Please review the initial version.");
await page.screenshot({ path: `${OUT}/03-send-for-review.png` });
await page.click('[data-testid="submit-for-review"]');
await page.waitForSelector('[data-testid="pending-request"]', { timeout: 15000 });
// modal shows under review badge without reload
const detailText = await page.textContent('[data-testid="policy-detail"]');
log("REVIEW: modal shows pending request without reload:", detailText.includes("Awaiting approval"));
log("REVIEW: modal shows under review badge:", /under review/i.test(detailText));
await page.screenshot({ path: `${OUT}/04-pending-request.png` });

const afterSubmit = await apiGet(adminTok, `/api/v1/compliance/policies/${created.id}`);
const versions2 = await apiGet(adminTok, `/api/v1/compliance/policies/${created.id}/versions`);
const requests1 = await apiGet(adminTok, `/api/v1/compliance/policies/${created.id}/approval-requests`);
log("REVIEW: backend policy status:", afterSubmit.status);
log("REVIEW: backend version status:", versions2[0]?.status);
log("REVIEW: backend request status:", requests1[0]?.status, "approver:", requests1[0]?.approver_user_id);

// ── 3. APPROVE as reviewer (Rhea) ────────────────────────────────────────────
await uiLogin("reviewer@complivibe.io", "Reviewer-2026!");
await page.goto(`${base}/dashboard/policies`, { waitUntil: "domcontentloaded" });
await page.waitForSelector(`[data-testid="policy-row-${created.id}"]`, { timeout: 20000 });
await page.click(`[data-testid="policy-row-${created.id}"]`);
await page.waitForSelector('[data-testid="approve-request"]', { timeout: 15000 });
await page.fill("#review-notes", "Content verified — approved via UI walkthrough.");
await page.screenshot({ path: `${OUT}/05-approver-view.png` });
await page.click('[data-testid="approve-request"]');
// modal must flip to approved WITHOUT reload
await page.waitForFunction(
  () => document.querySelector('[data-testid="policy-detail"]')?.textContent?.includes("approved"),
  { timeout: 15000 }
);
await page.waitForSelector('[data-testid="pending-request"]', { state: "detached", timeout: 15000 });
const approvedText = await page.textContent('[data-testid="policy-detail"]');
log("APPROVE: modal shows approved + live version without reload:", approvedText.includes("Live"));
await page.screenshot({ path: `${OUT}/06-approved-detail.png` });

const afterApprove = await apiGet(adminTok, `/api/v1/compliance/policies/${created.id}`);
const versions3 = await apiGet(adminTok, `/api/v1/compliance/policies/${created.id}/versions`);
const requests2 = await apiGet(adminTok, `/api/v1/compliance/policies/${created.id}/approval-requests`);
log(
  "APPROVE: backend policy:",
  afterApprove.status,
  "approved_by:",
  afterApprove.approved_by_user_id,
  "at:",
  afterApprove.approved_at
);
log("APPROVE: backend version:", versions3[0]?.status, "is_live:", versions3[0]?.is_live);
log("APPROVE: backend request:", requests2[0]?.status, "decided_at:", requests2[0]?.decided_at);

// ── 4. TEMPLATE CREATE + REJECT path ─────────────────────────────────────────
await uiLogin("admin@complivibe.io", "PhaseA-Rebuild-2026!");
await page.goto(`${base}/dashboard/policies`, { waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-testid="new-policy"]', { timeout: 20000 });
await page.waitForTimeout(2000);
await page.click('[data-testid="new-policy"]');
await page.waitForSelector('[data-testid="policy-form"]');
await page.click('[data-testid="policy-mode-template"]');
await selectByText("#policy-template", "Acceptable Use Policy");
await page.fill("#policy-override-title", TEMPLATE_TITLE);
await page.screenshot({ path: `${OUT}/07-template-form.png` });
await page.click('[data-testid="policy-form-submit"]');
await page.waitForSelector('[data-testid="policy-form"]', { state: "detached", timeout: 15000 });
await page.waitForSelector(`text=${TEMPLATE_TITLE}`, { timeout: 15000 });
log("TEMPLATE: created policy visible without reload:", true);

const policies2 = await apiGet(adminTok, "/api/v1/compliance/policies");
const tpol = policies2.find((p) => p.title === TEMPLATE_TITLE);
const tver = await apiGet(adminTok, `/api/v1/compliance/policies/${tpol.id}/versions`);
log("TEMPLATE: backend policy:", tpol?.status, "seeded version:", tver[0]?.version_number, tver[0]?.status);

// submit it for review, then reject as Rhea
await page.click(`[data-testid="policy-row-${tpol.id}"]`);
await page.waitForSelector('[data-testid="send-for-review"]', { timeout: 15000 });
await page.selectOption("#submit-version", tver[0].id);
await selectByText("#submit-approver", "Rhea Kapoor");
await page.click('[data-testid="submit-for-review"]');
await page.waitForSelector('[data-testid="pending-request"]', { timeout: 15000 });

await uiLogin("reviewer@complivibe.io", "Reviewer-2026!");
await page.goto(`${base}/dashboard/policies`, { waitUntil: "domcontentloaded" });
await page.waitForSelector(`[data-testid="policy-row-${tpol.id}"]`, { timeout: 20000 });
await page.click(`[data-testid="policy-row-${tpol.id}"]`);
await page.waitForSelector('[data-testid="reject-request"]', { timeout: 15000 });
await page.fill("#review-notes", "Scope section needs org-specific detail before approval.");
await page.click('[data-testid="reject-request"]');
await page.waitForSelector('[data-testid="pending-request"]', { state: "detached", timeout: 15000 });
await page.waitForFunction(
  () => document.querySelector('[data-testid="version-history"]')?.textContent?.includes("rejected"),
  { timeout: 15000 }
);
log("REJECT: modal shows rejected version without reload:", true);
await page.screenshot({ path: `${OUT}/08-rejected-detail.png` });

const tverAfter = await apiGet(adminTok, `/api/v1/compliance/policies/${tpol.id}/versions`);
const treq = await apiGet(adminTok, `/api/v1/compliance/policies/${tpol.id}/approval-requests`);
const tpolAfter = await apiGet(adminTok, `/api/v1/compliance/policies/${tpol.id}`);
log(
  "REJECT: backend version:",
  tverAfter[0]?.status,
  "review_notes:",
  JSON.stringify(tverAfter[0]?.review_notes),
  "| request:",
  treq[0]?.status,
  "| policy:",
  tpolAfter.status
);

log("console errors:", JSON.stringify(consoleErrors));
fs.writeFileSync(`${OUT}/evidence.txt`, evidence.join("\n") + "\n");
await browser.close();
