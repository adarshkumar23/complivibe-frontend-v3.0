import { test, expect } from "playwright/test";
import { execSync } from "child_process";
import { ORG_ID, PW } from "./routes";

// C4 — change a user's role LIVE and measure how long until the UI reflects it.
// Start unauthenticated; log in fresh as the dedicated C4 user.
test.use({ storageState: { cookies: [], origins: [] } });

const C4_EMAIL = "partd-c4@example.com";
const PSQL = `PGPASSWORD=complivibe_test_local_only psql -h localhost -U complivibe_test_user -d complivibe_loadtest -tAc`;

function setRole(role: string) {
  const sql = `UPDATE memberships SET role_id=(SELECT id FROM roles WHERE organization_id='${ORG_ID}' AND name='${role}') WHERE user_id=(SELECT id FROM users WHERE email='${C4_EMAIL}');`;
  execSync(`${PSQL} "${sql}"`, { shell: "/bin/bash" });
}
function currentRole(): string {
  return execSync(`${PSQL} "SELECT r.name FROM memberships m JOIN roles r ON r.id=m.role_id JOIN users u ON u.id=m.user_id WHERE u.email='${C4_EMAIL}';"`, { shell: "/bin/bash" }).toString().trim();
}

test("C4 role-change UI reflection latency (New Risk button, risks:write)", async ({ page }, testInfo) => {
  setRole("readonly"); // ensure known starting point
  const newRisk = () => page.getByRole("button", { name: /New Risk/i });

  // Login fresh as the C4 user
  await page.goto("/login");
  await page.fill("#email", C4_EMAIL);
  await page.fill("#password", PW);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });

  await page.goto("/dashboard/risks");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500);
  const beforeVisible = await newRisk().count();
  const startRole = currentRole();

  // Flip role live: readonly -> compliance_manager (gains risks:write)
  setRole("compliance_manager");
  const flippedTo = currentRole();

  // Observation A: no reload, just wait
  await page.waitForTimeout(3000);
  const aNoReload = await newRisk().count();

  // Observation B: simulate the user leaving and returning to the tab.
  // @tanstack/react-query 5.101 focusManager listens on WINDOW for "visibilitychange"
  // and checks document.visibilityState. The original Part-D test dispatched a
  // non-bubbling event on document, which never reached react-query's listener; a
  // real tab-refocus fires visibilitychange on window, which is what we do here.
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    window.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    window.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(3000);
  const bRefocus = await newRisk().count();

  // Observation C: full reload
  await page.reload();
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500);
  const cReload = await newRisk().count();

  const result = {
    startRole, flippedTo,
    button_before_change: beforeVisible,        // expect 0 (readonly)
    A_after_change_no_reload: aNoReload,        // 0 => stale window exists
    B_after_refocus: bRefocus,                  // >0 => refetch-on-focus catches it
    C_after_reload: cReload,                    // expect >0
    conclusion:
      aNoReload > 0 ? "reflects immediately (no reload)"
      : bRefocus > 0 ? "reflects on window refocus (react-query refetch), no hard reload needed"
      : cReload > 0 ? "requires a hard reload (stale window until reload; staleTime/no-invalidation)"
      : "did NOT reflect even after reload (unexpected)",
  };
  await testInfo.attach("c4", { body: JSON.stringify(result, null, 2), contentType: "application/json" });
  console.log("C4 RESULT:", JSON.stringify(result));

  setRole("readonly"); // reset
  expect(beforeVisible, "readonly should NOT see New Risk before change").toBe(0);
  expect(cReload, "compliance_manager SHOULD see New Risk after reload").toBeGreaterThan(0);
});
