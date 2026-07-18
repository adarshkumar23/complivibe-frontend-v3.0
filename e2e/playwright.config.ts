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
    // Pure Node render test (no browser, no backend, no auth dependency).
    { name: "iconguard", testMatch: /iconguard\.spec\.ts/ },
    ...PERSONAS.map((p) => ({
      name: p.key,
      // Per-persona: route smoke, hidden-button gating matrix, stub pages, and the
      // direct-API RBAC (403) matrix -- all evaluated from THIS persona's session.
      testMatch: /(smoke|gating|gating_domains5_12|stubs|directapi)\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: `partd/.auth/${p.key}.json` },
    })),
    // Admin-authed scenarios: C3 (forced 500), C4 (role change), the authorized
    // create-via-UI mutations, and the multi-persona policy approval-quorum matrix.
    {
      name: "scenarios",
      testMatch: /(error500|rolechange|mutation|mutation_domains5_12|policyapproval|directapi_domains5_12|evidence_ui)\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: `partd/.auth/admin.json` },
    },
  ],
});
