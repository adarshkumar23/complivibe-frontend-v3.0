import { chromium } from "playwright";

const base = "http://127.0.0.1:3777";
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

await page.goto(`${base}/dashboard/vendor-risk`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(8000);
const bodyText = await page.textContent("body");
console.log("has fresh vendor:", bodyText.includes("P0-Verify Vendor (overdue check)"));
console.log("has 'Overdue Assessments':", bodyText.includes("Overdue Assessments"));
console.log("has 'Assessment overdue' badge:", bodyText.includes("Assessment overdue"));
// Grab the KPI tile value for Overdue Assessments
const kpi = await page.evaluate(() => {
  const els = Array.from(document.querySelectorAll("*"));
  const label = els.find((e) => e.children.length === 0 && /Overdue Assessments/i.test(e.textContent || ""));
  if (!label) return null;
  const card = label.closest("div")?.parentElement;
  return card ? card.textContent : label.parentElement?.textContent;
});
console.log("overdue KPI tile text:", JSON.stringify(kpi));
await page.screenshot({ path: process.env.SHOT || "vendor-verify.png", fullPage: true });
console.log("console errors:", JSON.stringify(consoleErrors.slice(0, 5)));
await browser.close();
