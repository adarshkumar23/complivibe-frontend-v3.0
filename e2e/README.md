# Part-D E2E harness (Playwright)

Exhaustive route/button/permission-gating pass built 2026-07-16 against the
0306 (reviewer-descope) schema. **Not turnkey CI** — requires a provisioned stack:

1. Backend on :8600 against a fresh `alembic upgrade head` + seeded PG DB
   (RATE_LIMIT_ENABLED=false).
2. Seed 6 personas: `scratchpad_runs/seed_personas.py` in the backend repo
   (admin, compliance_manager, reviewer-unassigned, reviewer-assigned, auditor,
   readonly; password `PartDPass123!`; + one policy/approval-request for the
   assigned reviewer).
3. Frontend production build pointing at the backend:
   `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8600 npm run build && npx next start -p 3100`
4. `npx playwright test --config e2e/playwright.config.ts`

Specs: auth.setup (per-persona storageState) · smoke (routes render) ·
gating (risks:write button matrix) · stubs (Phase-B pages) ·
error500 (C3 forced-500 behavior) · rolechange (C4 role-change latency) ·
mutation (create-risk E2E).

Follow-up to productionize: parameterize ORG_ID/personas via env, add a
stack-provisioning script, add `@playwright/test` to devDependencies
(currently imports resolve via the `playwright/test` subpath of `playwright`).
