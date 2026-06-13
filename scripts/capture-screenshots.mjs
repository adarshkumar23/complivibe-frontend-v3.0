import { chromium } from "playwright";

const baseURL = process.env.BASE_URL || "http://localhost:3000";

async function capture() {
  const browser = await chromium.launch({ headless: true });

  const desktop = await browser.newContext({ viewport: { width: 1512, height: 982 } });
  const loginPage = await desktop.newPage();
  await loginPage.goto(`${baseURL}/login`, { waitUntil: "networkidle" });
  await loginPage.screenshot({ path: "screenshots/login-desktop.png", fullPage: true });
  await loginPage.close();

  const dashDesktop = await browser.newContext({ viewport: { width: 1512, height: 982 } });
  await dashDesktop.addInitScript(() => {
    localStorage.setItem("cv_token", "invalid-token-for-ui-validation");
  });
  const dashboardPage = await dashDesktop.newPage();
  await dashboardPage.goto(`${baseURL}/dashboard`, { waitUntil: "domcontentloaded" });
  await dashboardPage.waitForTimeout(8000);
  await dashboardPage.screenshot({ path: "screenshots/dashboard-desktop.png", fullPage: true });
  await dashboardPage.close();

  const dashMobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await dashMobile.addInitScript(() => {
    localStorage.setItem("cv_token", "invalid-token-for-ui-validation");
  });
  const mobilePage = await dashMobile.newPage();
  await mobilePage.goto(`${baseURL}/dashboard`, { waitUntil: "domcontentloaded" });
  await mobilePage.waitForTimeout(8000);
  await mobilePage.screenshot({ path: "screenshots/dashboard-mobile.png", fullPage: true });
  await mobilePage.close();

  const errorPageContext = await browser.newContext({ viewport: { width: 1512, height: 982 } });
  await errorPageContext.addInitScript(() => {
    localStorage.setItem("cv_token", "expired-token-error-state");
  });
  const errorPage = await errorPageContext.newPage();
  await errorPage.goto(`${baseURL}/dashboard`, { waitUntil: "domcontentloaded" });
  await errorPage.waitForTimeout(8000);
  await errorPage.screenshot({ path: "screenshots/dashboard-error-state.png", fullPage: true });

  await browser.close();
}

capture();
