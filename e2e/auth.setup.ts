import { test as setup, expect } from "playwright/test";
import { PERSONAS, PW } from "./routes";
import fs from "fs";

// Log in each persona through the REAL login UI (captures the httpOnly cookie +
// CSRF exactly as the app sets them) and persist storageState per persona.
for (const p of PERSONAS) {
  setup(`authenticate ${p.key}`, async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", p.email);
    await page.fill("#password", PW);
    await page.click('button[type="submit"]');
    // success = we leave /login for the dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
    await expect(page).toHaveURL(/\/dashboard/);
    fs.mkdirSync("partd/.auth", { recursive: true });
    await page.context().storageState({ path: `partd/.auth/${p.key}.json` });
  });
}
