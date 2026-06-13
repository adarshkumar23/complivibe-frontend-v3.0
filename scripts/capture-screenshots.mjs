import { chromium } from "playwright";

const baseURL = process.env.BASE_URL || "http://localhost:3000";
const TOKEN = "ui-validation-token";

async function shoot(browser, { path, url, mobile = false, wait = 7000 }) {
  const context = await browser.newContext(
    mobile
      ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
      : { viewport: { width: 1512, height: 982 } }
  );
  await context.addInitScript((token) => {
    localStorage.setItem("cv_token", token);
  }, TOKEN);
  const page = await context.newPage();
  await page.goto(`${baseURL}${url}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(wait);
  await page.screenshot({ path, fullPage: true });
  await context.close();
}

async function capture() {
  const browser = await chromium.launch({ headless: true });

  // Login (no token)
  const loginCtx = await browser.newContext({ viewport: { width: 1512, height: 982 } });
  const loginPage = await loginCtx.newPage();
  await loginPage.goto(`${baseURL}/login`, { waitUntil: "networkidle" });
  await loginPage.screenshot({ path: "screenshots/login-desktop.png", fullPage: true });
  await loginCtx.close();

  // Command Center dashboard
  await shoot(browser, { path: "screenshots/dashboard-desktop.png", url: "/dashboard" });
  await shoot(browser, { path: "screenshots/dashboard-mobile.png", url: "/dashboard", mobile: true });

  // Compliance page
  await shoot(browser, { path: "screenshots/compliance-desktop.png", url: "/dashboard/compliance" });
  await shoot(browser, { path: "screenshots/compliance-mobile.png", url: "/dashboard/compliance", mobile: true });

  await browser.close();
}

capture();
