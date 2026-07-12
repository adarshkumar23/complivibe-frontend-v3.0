import { chromium } from "playwright";
import fs from "node:fs";

const base = "http://127.0.0.1:3777";
const api = "http://127.0.0.1:8123";
const ORG = "3f663d8b-0d8a-439c-b5b5-be0f94198fe2";
const outDir = "reports/completion-pass/sa5-autopilot";
fs.mkdirSync(outDir, { recursive: true });

const evidence = [];
function log(step, data) {
  evidence.push({ step, at: new Date().toISOString(), data });
  console.log(`\n### ${step}`);
  console.log(typeof data === "string" ? data : JSON.stringify(data, null, 2).slice(0, 2000));
}

// API client for backend-state proofs (independent of the UI session)
const login = await fetch(`${api}/api/v1/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@complivibe.io", password: "PhaseA-Rebuild-2026!" })
}).then((r) => r.json());
const H = { Authorization: `Bearer ${login.access_token}`, "X-Organization-ID": ORG, "Content-Type": "application/json" };
const apiGet = (p) => fetch(`${api}${p}`, { headers: H }).then((r) => r.json());

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

await page.goto(`${base}/dashboard/autopilot`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4000);
await page.screenshot({ path: `${outDir}/01-initial.png`, fullPage: true });
log("initial page", "screenshot 01-initial.png");

// ── Mutation 1: create guardrail policy (require_approval, default) ──────────
await page.click('[data-testid="new-policy"]');
await page.fill("#pol-name", "Approval-gated automation baseline");
await page.fill("#pol-desc", "Every autopilot action above low band needs a human decision.");
await page.selectOption("#pol-mode", "require_approval");
await page.check('input[type="checkbox"]'); // "Make default" is the only plain checkbox in this modal
await page.screenshot({ path: `${outDir}/02-policy-form.png` });
await page.click('button[type="submit"]:has-text("Create policy")');
await page.waitForSelector("text=Approval-gated automation baseline", { timeout: 10000 });
const policies1 = await apiGet("/api/v1/ai-governance/autopilot/policies");
const polA = policies1.find((p) => p.name === "Approval-gated automation baseline" && p.status === "active");
log("M1 create policy — API proof", { found: Boolean(polA), id: polA?.id, mode: polA?.mode, is_default: polA?.is_default });
await page.screenshot({ path: `${outDir}/03-policy-created.png`, fullPage: true });

// ── Mutation 2: plan a candidate action (medium band → approval_required) ────
await page.click('[data-testid="plan-action"]');
await page.waitForSelector("#pa-template");
await page.selectOption("#pa-template", "send_reminder");
await page.fill("#pa-title", "Remind owner: quarterly access review");
await page.screenshot({ path: `${outDir}/04-plan-form.png` });
await page.click('button[type="submit"]:has-text("Plan action")');
await page.waitForSelector('[data-testid="plan-result"]', { timeout: 10000 });
const planResultText = await page.textContent('[data-testid="plan-result"]');
log("M2 plan action — modal result", planResultText);
await page.screenshot({ path: `${outDir}/05-plan-result.png` });
await page.click('button:has-text("Done")');
await page.waitForSelector("text=Remind owner: quarterly access review", { timeout: 10000 });
const intents1 = await apiGet("/api/v1/ai-governance/autopilot/execution-intents");
const intentA = intents1.find((i) => i.plan_payload_json?.candidate_action?.title === "Remind owner: quarterly access review");
log("M2 create intent — API proof", { found: Boolean(intentA), id: intentA?.id, status: intentA?.intent_status });
await page.screenshot({ path: `${outDir}/06-intent-in-table.png`, fullPage: true });

// ── Mutation 3: request approval on the intent ───────────────────────────────
await page.click('button:has-text("Request approval")');
await page.waitForSelector("text=approval requested", { timeout: 10000 });
const approvals1 = await apiGet("/api/v1/ai-governance/autopilot/execution-approvals");
const apprA = approvals1.find((a) => a.execution_intent_id === intentA.id);
log("M3 request approval — API proof", { found: Boolean(apprA), id: apprA?.id, status: apprA?.approval_status });
await page.screenshot({ path: `${outDir}/07-approval-requested.png`, fullPage: true });

// ── Mutation 4: approve it ───────────────────────────────────────────────────
await page.click(`[data-testid="approve-${apprA.id}"]`);
await page.waitForSelector("text=approval approved", { timeout: 10000 });
const apprA2 = (await apiGet("/api/v1/ai-governance/autopilot/execution-approvals")).find((a) => a.id === apprA.id);
const readiness = await apiGet(`/api/v1/ai-governance/autopilot/execution-intents/${intentA.id}/readiness`);
log("M4 approve — API proof", {
  approval_status: apprA2?.approval_status,
  readiness_state: readiness?.readiness_state,
  ready_for_runner: readiness?.ready_for_runner
});
await page.screenshot({ path: `${outDir}/08-approved.png`, fullPage: true });

// ── Mutation 5: reject flow on a second intent ───────────────────────────────
await page.click('[data-testid="plan-action"]');
await page.waitForSelector("#pa-template");
await page.selectOption("#pa-template", "refresh_stale_signals");
await page.fill("#pa-title", "Refresh drift signals for scoring model");
await page.click('button[type="submit"]:has-text("Plan action")');
await page.waitForSelector('[data-testid="plan-result"]', { timeout: 10000 });
await page.click('button:has-text("Done")');
await page.waitForSelector("text=Refresh drift signals for scoring model", { timeout: 10000 });
await page.click('button:has-text("Request approval")');
await page.waitForTimeout(1500);
const approvals2 = await apiGet("/api/v1/ai-governance/autopilot/execution-approvals");
const apprB = approvals2.find((a) => a.approval_status === "requested");
await page.click(`li:has([data-testid="approve-${apprB.id}"]) button:has-text("Reject")`);
await page.fill('input[aria-label="Rejection reason"]', "Signals were refreshed manually this morning");
await page.click('button:has-text("Confirm reject")');
await page.waitForSelector("text=approval rejected", { timeout: 10000 });
const apprB2 = (await apiGet("/api/v1/ai-governance/autopilot/execution-approvals")).find((a) => a.id === apprB.id);
log("M5 reject — API proof", { approval_status: apprB2?.approval_status, decision_reason: apprB2?.decision_reason });
await page.screenshot({ path: `${outDir}/09-rejected.png`, fullPage: true });

// ── Mutation 6: org auto-execute opt-in toggle ───────────────────────────────
const before = await apiGet("/api/v1/organizations/me/governance-settings");
await page.click('[data-testid="auto-execute-toggle"]');
await page.waitForTimeout(1500);
const after = await apiGet("/api/v1/organizations/me/governance-settings");
log("M6 opt-in toggle — API proof", {
  before: before.autopilot_auto_execute_enabled,
  after: after.autopilot_auto_execute_enabled
});
await page.screenshot({ path: `${outDir}/10-optin-on.png`, fullPage: true });

// ── Mutation 7: create execute_safe_later policy, then auto-executed action ──
await page.click('[data-testid="new-policy"]');
await page.fill("#pol-name", "Safe low-risk auto-execution");
await page.selectOption("#pol-mode", "execute_safe_later");
await page.click('button[role="switch"][aria-label="Task creation"]');
await page.check('input[type="checkbox"]');
await page.click('button[type="submit"]:has-text("Create policy")');
await page.waitForSelector("text=Safe low-risk auto-execution", { timeout: 10000 });

await page.click('[data-testid="plan-action"]');
await page.waitForSelector("#pa-template");
await page.selectOption("#pa-template", "send_reminder");
await page.fill("#pa-title", "Auto reminder: evidence refresh due");
await page.selectOption("#pa-band", "low");
await page.click('label:has-text("Mark automation-allowed") input[type="checkbox"]');
await page.click('button[type="submit"]:has-text("Plan action")');
await page.waitForSelector('[data-testid="plan-result"]', { timeout: 10000 });
await page.click('button:has-text("Done")');
await page.waitForSelector("text=auto reminder: evidence refresh due", { timeout: 10000 }).catch(() => {});
await page.waitForTimeout(1500);
const executions = await apiGet("/api/v1/ai-governance/autopilot/executions");
const exec = executions.find((e) => e.execution_status === "executed");
log("M7 auto-execute — API proof", {
  found: Boolean(exec),
  id: exec?.id,
  action_key: exec?.action_key,
  status: exec?.execution_status,
  created_task: exec?.after_snapshot_json?.task_id ?? null
});
await page.screenshot({ path: `${outDir}/11-executed.png`, fullPage: true });

// ── Mutation 8: reverse the execution from the UI ────────────────────────────
await page.click(`[data-testid="reverse-${exec.id}"]`);
// Wait for the react-query refetch to remove the Reverse button (row is now reversed)
await page.waitForSelector(`[data-testid="reverse-${exec.id}"]`, { state: "detached", timeout: 10000 });
await page.waitForTimeout(500);
const exec2 = (await apiGet("/api/v1/ai-governance/autopilot/executions")).find((e) => e.id === exec.id);
log("M8 reverse execution — API proof", { status: exec2?.execution_status, reversed_at: exec2?.reversed_at });
await page.screenshot({ path: `${outDir}/12-reversed.png`, fullPage: true });

// ── Mutation 9: archive the rejected intent ──────────────────────────────────
const intentB = (await apiGet("/api/v1/ai-governance/autopilot/execution-intents")).find(
  (i) => i.plan_payload_json?.candidate_action?.title === "Refresh drift signals for scoring model"
);
await page.click(`li:has-text("Refresh drift signals for scoring model") >> button:has-text("Archive")`);
await page.waitForTimeout(1500);
const intentB2 = (await apiGet("/api/v1/ai-governance/autopilot/execution-intents")).find((i) => i.id === intentB.id);
log("M9 archive intent — API proof", { status: intentB2?.intent_status, archived_at: intentB2?.archived_at });
const gone = await page.locator('text=Refresh drift signals for scoring model').count();
log("M9 archived intent removed from UI without reload", { visibleRows: gone });
await page.screenshot({ path: `${outDir}/13-final.png`, fullPage: true });

log("console errors", consoleErrors);
fs.writeFileSync(`${outDir}/evidence.json`, JSON.stringify(evidence, null, 2));
await browser.close();
if (consoleErrors.length) {
  console.error("CONSOLE ERRORS PRESENT");
  process.exit(1);
}
console.log("\nALL STEPS DONE");
