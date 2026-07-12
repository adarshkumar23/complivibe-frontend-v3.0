import { chromium } from "playwright";

const base = "http://127.0.0.1:3777";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1512, height: 982 } });
const page = await ctx.newPage();
const consoleErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => consoleErrors.push("PAGEERROR: " + e.message));

// Real login through the UI form
await page.goto(`${base}/login`, { waitUntil: "networkidle" });
await page.fill('input[type="email"]', "admin@complivibe.io");
await page.fill('input[type="password"]', "PhaseA-Rebuild-2026!");
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard**", { timeout: 20000 });
console.log("LOGIN OK, url:", page.url());

// Evidence page
await page.goto(`${base}/dashboard/evidence`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(8000);
const bodyText = await page.textContent("body");
console.log("has 'Readiness Gaps':", bodyText.includes("Readiness Gaps"));
console.log("has crash text:", /application error|something went wrong|unhandled/i.test(bodyText));
console.log("has real gap control name:", bodyText.includes("Enforce MFA for all workforce identities"));
console.log("has 'never linked':", bodyText.includes("never linked"));
await page.screenshot({ path: process.env.SHOT || "evidence-verify.png", fullPage: true });
console.log("console errors:", JSON.stringify(consoleErrors.slice(0, 10), null, 1));
await browser.close();
