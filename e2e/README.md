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
gating (create-button matrix for risks/controls/policies/vendors) · stubs
(Phase-B pages) · directapi (per-persona create-endpoint RBAC: writers 2xx,
non-writers 403) · error500 (C3 forced-500 behavior) · rolechange (C4
role-change latency) · mutation (create-{risk,control,policy,vendor} E2E) ·
policyapproval (safety-critical approval-quorum matrix).

## Mutation-matrix domains (risks + controls + policies + vendors)

Both-sides RBAC per domain, cross-referenced against the live 0307 catalog
(controls:write / compliance_policies:write / vendors:write are all held by
exactly {admin, compliance_manager}):
- **Hidden button** (`gating.spec.ts`): each create button is gated by its domain
  write permission via `useHasPermission(...)`; non-writers must not see it.
- **Direct-API 403** (`directapi.spec.ts`): independently of the UI, the backend
  rejects a create from any non-writer with 403 (defense in depth).
- **Authorized mutation** (`mutation.spec.ts`): admin drives the real create form
  and a re-fetch confirms the backend persisted it.
- **Policy approval quorum** (`policyapproval.spec.ts`): an assigned reviewer can
  approve THAT request via instance-level authority even though the reviewer role
  was de-scoped from the blanket compliance_policies:approve grant; an unassigned
  reviewer/auditor gets 403; the requester is blocked from self-approving (400).

Two app fixes landed alongside these tests (see the commit): (1) the
controls/policies/vendor-risk create+edit buttons were NOT permission-gated
(unlike risks) — added `useHasPermission` gating to match. (2) `SeverityBadge`
crashed the whole vendor-risk page in the production build when a vendor's
`risk_tier` was an unknown value (e.g. "not_assessed") — added a neutral fallback.

Follow-up to productionize: parameterize ORG_ID/personas via env, add a
stack-provisioning script, add `@playwright/test` to devDependencies
(currently imports resolve via the `playwright/test` subpath of `playwright`).
