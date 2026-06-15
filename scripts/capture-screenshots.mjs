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

  // AI Systems page
  await shoot(browser, { path: "screenshots/ai-systems-desktop.png", url: "/dashboard/ai-systems" });
  await shoot(browser, { path: "screenshots/ai-systems-mobile.png", url: "/dashboard/ai-systems", mobile: true });

  // Data Observability page
  await shoot(browser, { path: "screenshots/data-observability-desktop.png", url: "/dashboard/data-observability" });
  await shoot(browser, { path: "screenshots/data-observability-mobile.png", url: "/dashboard/data-observability", mobile: true });

  // Evidence Vault page
  await shoot(browser, { path: "screenshots/evidence-desktop.png", url: "/dashboard/evidence" });
  await shoot(browser, { path: "screenshots/evidence-mobile.png", url: "/dashboard/evidence", mobile: true });

  // Risk Command Center page
  await shoot(browser, { path: "screenshots/risks-desktop.png", url: "/dashboard/risks" });
  await shoot(browser, { path: "screenshots/risks-mobile.png", url: "/dashboard/risks", mobile: true });

  // Incident Response Command Center page
  await shoot(browser, { path: "screenshots/incidents-desktop.png", url: "/dashboard/incidents" });
  await shoot(browser, { path: "screenshots/incidents-mobile.png", url: "/dashboard/incidents", mobile: true });

  // Reports page
  await shoot(browser, { path: "screenshots/reports-desktop.png", url: "/dashboard/reports" });
  await shoot(browser, { path: "screenshots/reports-mobile.png", url: "/dashboard/reports", mobile: true });

  // Audit Pack page
  await shoot(browser, { path: "screenshots/audit-pack-desktop.png", url: "/dashboard/audit-pack" });
  await shoot(browser, { path: "screenshots/audit-pack-mobile.png", url: "/dashboard/audit-pack", mobile: true });

  // Trust Center page
  await shoot(browser, { path: "screenshots/trust-center-desktop.png", url: "/dashboard/trust-center" });
  await shoot(browser, { path: "screenshots/trust-center-mobile.png", url: "/dashboard/trust-center", mobile: true });

  // Questionnaires page
  await shoot(browser, { path: "screenshots/questionnaires-desktop.png", url: "/dashboard/questionnaires" });
  await shoot(browser, { path: "screenshots/questionnaires-mobile.png", url: "/dashboard/questionnaires", mobile: true });

  // Settings page
  await shoot(browser, { path: "screenshots/settings-desktop.png", url: "/dashboard/settings" });
  await shoot(browser, { path: "screenshots/settings-mobile.png", url: "/dashboard/settings", mobile: true });

  // Alerts page
  await shoot(browser, { path: "screenshots/alerts-desktop.png", url: "/dashboard/alerts" });
  await shoot(browser, { path: "screenshots/alerts-mobile.png", url: "/dashboard/alerts", mobile: true });

  // AI System Detail (use a real id via DETAIL_ID env; falls back to a sample id that shows empty states)
  const detailId = process.env.DETAIL_ID || "sample";
  await shoot(browser, { path: "screenshots/ai-system-detail-desktop.png", url: `/dashboard/ai-systems/${detailId}` });
  await shoot(browser, { path: "screenshots/ai-system-detail-mobile.png", url: `/dashboard/ai-systems/${detailId}`, mobile: true });

  await browser.close();
}

capture();
