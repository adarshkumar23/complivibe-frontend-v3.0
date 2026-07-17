import { defineConfig, devices } from "playwright/test";
import { PERSONAS, BASE_UI } from "./routes";

// One setup project authenticates all personas; one project per persona reuses its
// storageState. Serial + single worker for deterministic auth-state and to avoid
// hammering the single test stack.
export default defineConfig({
  testDir: ".",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "partd-results.json" }]],
  use: {
    baseURL: BASE_UI,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    ...PERSONAS.map((p) => ({
      name: p.key,
      testMatch: /(smoke|gating|stubs)\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: `partd/.auth/${p.key}.json` },
    })),
    // C3 (forced 500) and C4 (role change) run as their own admin-authed project.
    {
      name: "scenarios",
      testMatch: /(error500|rolechange|mutation)\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: `partd/.auth/admin.json` },
    },
  ],
});
