// Frontend-backend alignment smoke (Phase 16).
// Verifies login UI is password-only, no SSO/OAuth buttons, unauthenticated
// dashboard access redirects to /login, and invalid credentials show a clean error.
// Usage: BASE_URL=http://localhost:3100 node scripts/alignment-smoke.mjs
import { chromium } from "playwright";

const baseURL = process.env.BASE_URL || "http://localhost:3100";
const results = [];
function record(name, pass, detail = "") {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  // 1. Login page renders email + password fields.
  await page.goto(`${baseURL}/login`, { waitUntil: "networkidle" });
  const hasEmail = (await page.locator('input[type="email"]').count()) > 0;
  const hasPassword = (await page.locator('input[type="password"]').count()) > 0;
  record("login: email + password fields present", hasEmail && hasPassword);

  // 2. No SSO / OAuth / enterprise login buttons.
  const body = (await page.locator("body").innerText()).toLowerCase();
  const ssoTerms = ["sign in with google", "continue with google", "sign in with microsoft", "continue with microsoft", "single sign-on", "sso", "saml", "okta"];
  const found = ssoTerms.filter((t) => body.includes(t));
  record("login: no SSO/OAuth buttons", found.length === 0, found.length ? `found: ${found.join(", ")}` : "password-only");

  // 3. Unauthenticated /dashboard redirects to /login.
  await page.goto(`${baseURL}/dashboard`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  record("auth: unauthenticated /dashboard redirects to /login", page.url().includes("/login"), page.url());

  // 4. Invalid login shows a clean error (single attempt to avoid rate-limit).
  await page.goto(`${baseURL}/login`, { waitUntil: "networkidle" });
  await page.locator('input[type="email"]').fill("qa-no-such-user@example.invalid");
  await page.locator('input[type="password"]').fill("definitely-wrong-password");
  await page.locator('button[type="submit"]').click();
  let errText = "";
  try {
    await page.waitForFunction(() => /invalid|too many|try again|server/i.test(document.body.innerText), { timeout: 8000 });
    errText = await page.locator("body").innerText();
  } catch {
    errText = await page.locator("body").innerText();
  }
  const cleanError = /invalid email or password|too many attempts|try again/i.test(errText);
  const stillOnLogin = page.url().includes("/login");
  record("auth: invalid login shows clean error, stays on /login", cleanError && stillOnLogin);

  await browser.close();
  const failed = results.filter((r) => !r.pass);
  console.log(`\nSMOKE RESULT: ${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

run().catch((e) => {
  console.error("smoke crashed:", e);
  process.exit(2);
});
