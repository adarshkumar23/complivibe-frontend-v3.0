# SA-8 report — Legal & Whistleblower, Billing & ESG, Security, Enterprise, Employee Compliance

Agent id: `sa8-small-domains`. Frontend `full-completion-pass` branch, dev server `http://127.0.0.1:3777`,
backend `http://127.0.0.1:8123`. All five pages were render-only before this pass (no mutation UI existed).
Every create endpoint below was confirmed live against `reports/live-openapi.json` and by direct curl before
building, then verified end-to-end with Playwright driving the real UI, followed by an authenticated
`GET` proving the backend actually changed, and confirmed the on-screen list updated with zero manual reload.

Verification script: `scripts/verify-sa8.mjs` (run per-domain: `node scripts/verify-sa8.mjs <legal|billing|security|enterprise|employee>`).
Evidence: `reports/completion-pass/sa8-small-domains/*.png` (before/after screenshots) and `*-api-proof.json`
(raw GET responses proving backend state). `npx tsc --noEmit` is clean for the whole repo.

---

## 1. Legal & Whistleblower (`app/dashboard/legal`)

Live endpoints confirmed in spec: `POST /api/v1/legal-matters` (LegalMatterCreate) and
`POST /api/v1/whistleblower/submit` (WhistleblowerReportSubmitRequest). Both built.

**Built:**
- `LegalMatterFormModal` (`components/legal/LegalMatterFormModal.tsx`) — title, matter_type (real enum:
  litigation / regulatory_inquiry / contract_dispute / ip_dispute / employment / other), opposing party,
  outside counsel, budget, description. Wired into `LegalMattersTable` via a "New matter" button.
- `WhistleblowerSubmitModal` (`components/legal/WhistleblowerSubmitModal.tsx`) — category (real enum: fraud
  / corruption / harassment / safety_violation / data_privacy / financial_misconduct / discrimination /
  retaliation / other) and description. The backend returns a one-time `tracking_code` — this is the
  reporter's only way to check status/reply anonymously, so the modal shows it prominently with a copy
  button after submission rather than silently closing. `organization_id` is required by the backend body
  (this is an anonymous-capable endpoint) — the UI sources it from the same `cv_org` local-storage value
  `apiFetch` uses for the header. Wired into `WhistleblowerPanel` via a "Submit report" button.
- API layer additions: `lib/api/legal.ts` (`createLegalMatter`, `submitWhistleblowerReport`, type constants).
- Hooks: `lib/hooks/useLegal.ts` (`useCreateLegalMatter`, `useSubmitWhistleblowerReport`), invalidating
  `legal-matters` / `wb-reports` query keys so both panels refresh without reload.

**Verified live:**
- Created legal matter "Vendor DPA dispute — Acme SaaS ###" (contract_dispute, ₹250000 budget, opposing
  party "Acme Corp") → appeared in the table with no reload → `GET /api/v1/legal-matters` confirmed the row
  exists with matching fields. Evidence: `legal-matter-api-proof.json`, `legal-before.png`/`legal-after.png`.
- Submitted an anonymous whistleblower report (category `data_privacy`) → tracking code
  `BdDsaIAE6Xt65wZeI-yVSpsF-x3KilaxHaKR8MjmG1E` shown once → after closing, the new report appeared in the
  panel with no reload → `GET /api/v1/whistleblower/reports` confirmed the row exists. Evidence:
  `legal-wb-api-proof.json`.
- Console errors during both flows: zero.

**Gaps (real, not built):** `PATCH /api/v1/whistleblower/reports/{id}/status` and
`POST /api/v1/legal-matters/{id}/close` / `/status` exist but are investigator/case-management update flows,
not creates — out of scope for this pass per the brief (create actions only). Left as render-only.

---

## 2. Billing & ESG (`app/dashboard/billing`)

Live endpoints confirmed: `POST /api/v1/billing/usage/spend-cap` (UsageSpendCapUpdateRequest) and the
carbon-accounting ingest pair `POST /api/v1/carbon-accounting/api-key` + `POST /api/v1/carbon-accounting/readings`
(CarbonEmissionsReadingIngest). No plan-change/invoice-create endpoints exist (`POST /billing/subscribe` and
`/cancel` are plan transitions, not something to fabricate a form around without a defined plan-selection UX
in scope — left out; see gaps).

**Built:**
- `SpendCapModal` (`components/billing/SpendCapModal.tsx`) — enable/disable toggle + INR cap amount, seeded
  from the live usage dashboard so it reflects real current state, not a blank form.
- `CarbonReadingModal` (`components/billing/CarbonReadingModal.tsx`) — scope1/2/3, the real 15 GHG Protocol
  Scope 3 categories (only shown when scope3 selected, per backend validation), source, period start/end,
  value, unit (kgCO2e/tCO2e/MTCO2e — the only 3 the backend accepts).
- **Auth wrinkle handled explicitly:** `POST /carbon-accounting/readings` does NOT accept the bearer token —
  it authenticates only via `X-CompliVibe-Key`, provisioned once via `POST /carbon-accounting/api-key`
  (bearer-authed). `ingestCarbonReading()` in `lib/api/billing.ts` provisions the key on first use, caches it
  in `localStorage`, and auto-reprovisions+retries once on a 401 (stale/rotated key) — deliberately bypassing
  `apiFetch` for this one call so a bad ingest key never triggers the global "session expired, redirect to
  login" handler (which only fires for bearer-token 401s). `app/api/proxy/[...path]/route.ts` was extended to
  forward the `X-CompliVibe-Key` header (previously only forwarded auth/org headers) — this is a shared file
  but the change is additive and header-scoped, no existing behavior touched.
- KPI caption on "Billable Units" now shows the live cap and breach state when set.
- API: `lib/api/billing.ts` (`setUsageSpendCap`, `provisionCarbonApiKey`, `ingestCarbonReading`, category/unit
  constants). Hooks: `lib/hooks/useBilling.ts` (`useSetSpendCap`, `useIngestCarbonReading`).

**Verified live:**
- Enabled spend cap at ₹50,000 → KPI caption updated to "cap ₹50000" with no reload →
  `GET /api/v1/billing/usage/dashboard` confirmed `usage_spend_cap_enabled: true`,
  `usage_spend_cap_inr: 50000`. Evidence: `billing-spendcap-api-proof.json`.
- Recorded a scope3 `business_travel` reading (3.2 tCO2e) → Carbon panel showed the `scope3` line with no
  reload → `GET /api/v1/carbon-accounting/dashboard` confirmed `reading_count` incremented 1→2 and
  `totals_by_scope` gained the scope3 bucket. Evidence: `billing-carbon-api-proof.json`,
  `billing-before.png`/`billing-after.png`.
- Console errors: zero.

**Gaps (real, not built):** `POST /api/v1/billing/subscribe` and `/cancel` exist but change the org's live
subscription/plan — building a "click to change plan" control against a shared demo org felt out of scope
for a completion pass and risks destabilizing other agents' test runs against billing status; documenting
rather than wiring. `POST /api/v1/billing/usage/sync` (push usage to Razorpay/processor) exists but this demo
org has `synced_to_processor: false` with no processor configured — building it would only ever 4xx/503
honestly, so it's a defensible future add, deprioritized in favor of the two working flows above.

---

## 3. Security (`app/dashboard/security`)

Live endpoints confirmed: `POST /api/v1/non-human-identities` (NonHumanIdentityCreate). The other `/security/*`
POSTs (`ingest/openscap`, `/prowler`, `/trivy`, `/wazuh`) are machine-to-machine scanner webhooks, not
human-driven create forms — no UI built for those (documented below). `sod-conflicts/rules` create exists but
SoD rules are not rendered anywhere on this page (only findings are, read-only) — out of scope for this pass.

**Built:**
- `NhiFormModal` (`components/security/NhiFormModal.tsx`) — name, identity_type (service_account/api_key/bot
  — real enum), owner (real org member picker from `GET /api/v1/users`, backend requires a valid
  `owner_user_id`), environment, risk_level (low/medium/high/critical — real enum), description.
- `NhiPanel` was upgraded from a risk-level histogram (derived only from `/summary`) to a real identity list
  from `GET /api/v1/non-human-identities`, with a "Register" button, plus a hygiene banner (unrotated/orphaned
  counts) sourced from `/summary`.
- API: `lib/api/security.ts` (`getNonHumanIdentities`, `createNonHumanIdentity`, type constants). Hooks:
  `lib/hooks/useSecurity.ts` (`useCreateNhi`), new `nhiList` query, invalidated together with `nhi-summary`.

**Verified live:**
- Registered `ci-deploy-bot-###` (service_account, owner "Phase A Admin", environment production, risk medium)
  → identity appeared in the panel list with no reload → `GET /api/v1/non-human-identities` confirmed the
  record exists with matching fields. Evidence: `security-nhi-api-proof.json`,
  `security-before.png`/`security-after.png`.
- Console errors: zero.

**Gaps (real, not built):** `POST /api/v1/security/ingest/{openscap,prowler,trivy,wazuh}` are scanner webhook
ingest endpoints (bearer/API-key-authed machine calls with tool-specific payload shapes) — there is no
sensible human "create a scan job" form; a UI trigger would be fake. Documented, not built.
`POST /api/v1/sod-conflicts/rules` exists but the page has no SoD-rules list to attach a create action to
(only read-only findings render) — would require adding a whole new panel outside this page's current scope;
left as a gap.

---

## 4. Enterprise (`app/dashboard/enterprise`)

Live endpoints confirmed: `POST /api/v1/compliance/business-units` (BusinessUnitCreate) and
`POST /api/v1/access-certifications/campaigns` (AccessCertificationCampaignCreate).

**Built:**
- `BusinessUnitFormModal` (`components/enterprise/BusinessUnitFormModal.tsx`) — name, code, optional real
  parent-unit picker (sourced from the org's actual existing units, not fabricated), description.
- `AccessCertCampaignModal` (`components/enterprise/AccessCertCampaignModal.tsx`) — name, due date, initial
  status (draft/active — the two sane creation states out of the schema's 5), description.
- New `BusinessUnitsPanel` (appended to `components/enterprise/EnterprisePanels.tsx`) — the page previously
  had a Business Units KPI count but no list/create anywhere; added a full panel with create button, wired
  into the enterprise page grid (now 3-up: Business Units / Recertification / Access Certifications).
- `AccessCertPanel` got a "New campaign" button.
- API: `lib/api/enterprise.ts` (`createBusinessUnit`, `createAccessCertCampaign`, status constants). Hooks:
  `lib/hooks/useEnterpriseControl.ts` (`useCreateBusinessUnit`, `useCreateAccessCertCampaign`).

**Verified live:**
- Created business unit "India Engineering ###" (code `IN-ENG-###`) → appeared in the new panel with no
  reload → `GET /api/v1/compliance/business-units` confirmed the record. Evidence:
  `enterprise-bu-api-proof.json`.
- Created access certification campaign "Q3 2026 production access review ###" (due 2026-09-30, status
  active) → appeared in the panel with no reload → `GET /api/v1/access-certifications/campaigns` confirmed
  the record. Evidence: `enterprise-accesscert-api-proof.json`,
  `enterprise-before.png`/`enterprise-after.png`.
- Console errors: zero.

**Gaps (real, not built):** none for this domain — both real create endpoints render-supported were built.
`compliance/business-units/tag` (tagging entities to a BU) and access-cert item-level certify/revoke actions
exist but are follow-on workflow actions on existing records, not creates — out of scope per the brief.

---

## 5. Employee Compliance (`app/dashboard/employee-compliance`)

Live endpoints confirmed: `POST /api/v1/compliance/attestation-campaigns` (AttestationCampaignCreateRequest)
and `POST /api/v1/training-analytics/records` (TrainingCompletionRecordCreate).

**Built:**
- `AttestationCampaignModal` (`components/employee-compliance/AttestationCampaignModal.tsx`) — targets a
  real policy (options from `GET /api/v1/compliance/policies`, since the backend requires a valid
  `policy_id`), title, due date, optional attestation statement text and description.
- `TrainingRecordModal` (`components/employee-compliance/TrainingRecordModal.tsx`) — assignee (real org
  member from `GET /api/v1/users`), training type (free text per schema — no enum in the backend), due date.
- Wired "Assign training" into `TrainingRecordsPanel` and "New campaign" into `AttestationCampaignsPanel`.
- API: `lib/api/employee-compliance.ts` (`createAttestationCampaign`, `createTrainingRecord`). Hooks:
  `lib/hooks/useEmployeeCompliance.ts` (`useCreateAttestationCampaign`, `useCreateTrainingRecord`),
  invalidating both the list and summary/dashboard query keys so KPIs and lists refresh together.

**Verified live:**
- Assigned training `security_awareness_###` to "Phase A Admin" (due 2026-08-31) → appeared in the Training
  Records panel with no reload → `GET /api/v1/training-analytics/records` confirmed the record. Evidence:
  `employee-training-api-proof.json`.
- Launched attestation campaign "AI acceptable-use attestation ###" against the real "Acceptable Use of AI
  Tools" policy (due 2026-08-15) → appeared in the campaigns panel with no reload →
  `GET /api/v1/compliance/attestation-campaigns` confirmed the record. Evidence:
  `employee-attestation-api-proof.json`, `employee-before.png`/`employee-after.png`.
- Console errors during the flow: zero on a clean isolated re-run (one `cmp-issue-dashboard` react-query
  warning appeared during the combined test run — traced to `useCommandCenter`/`useCompliance`, files this
  agent does not own; it does not reproduce on a plain navigation pass through these five pages and is not
  caused by any change in this report — see note below).

**Gaps (real, not built):** none for this domain's two real create endpoints. `POST /training-datasets`
(AI training-data governance, a different "training") is unrelated to this page's employee-training-analytics
data and belongs to the AI-systems domain, not employee compliance — correctly not touched here.

---

## Files touched

**New:**
- `components/legal/LegalMatterFormModal.tsx`, `components/legal/WhistleblowerSubmitModal.tsx`
- `components/billing/SpendCapModal.tsx`, `components/billing/CarbonReadingModal.tsx`
- `components/security/NhiFormModal.tsx`
- `components/enterprise/BusinessUnitFormModal.tsx`, `components/enterprise/AccessCertCampaignModal.tsx`
- `components/employee-compliance/AttestationCampaignModal.tsx`, `components/employee-compliance/TrainingRecordModal.tsx`
- `scripts/verify-sa8.mjs`

**Modified:**
- `lib/api/legal.ts`, `lib/api/billing.ts`, `lib/api/security.ts`, `lib/api/enterprise.ts`, `lib/api/employee-compliance.ts`
- `lib/hooks/useLegal.ts`, `lib/hooks/useBilling.ts`, `lib/hooks/useSecurity.ts`, `lib/hooks/useEnterpriseControl.ts`, `lib/hooks/useEmployeeCompliance.ts`
- `components/legal/LegalMattersTable.tsx`, `components/legal/WhistleblowerPanel.tsx`
- `app/dashboard/billing/page.tsx`, `components/billing/BillingKpis.tsx`
- `components/security/SecurityPanels.tsx`
- `app/dashboard/enterprise/page.tsx`, `components/enterprise/EnterprisePanels.tsx`
- `components/employee-compliance/EmployeePanels.tsx`
- `app/api/proxy/[...path]/route.ts` — added forwarding of `X-CompliVibe-Key` (additive, header-scoped; needed
  because carbon-accounting ingest authenticates outside the bearer-token model)

**Reused (built by another parallel agent, not modified):** `components/ui/Modal.tsx`, `lib/api/users.ts`.

## Verification summary

19 assertions across 5 domains, 19 pass, 0 fail. `npx tsc --noEmit` clean. Zero console errors attributable to
this agent's code across isolated per-domain runs and a clean combined navigation pass.
