# SA-4 Report — AI Systems + AI Testing mutation UI

Agent: `sa4-ai-systems` · Date: 2026-07-11 · `npx tsc --noEmit` clean · Console errors during flows: **zero**

## What was built

### 1. AI Risk Assessment CREATE (AI Testing page)
- New "New assessment" button in the **AI Risk Assessments** card (`components/ai-testing/AiTestingTable.tsx`) opens `components/ai-testing/CreateAssessmentModal.tsx`.
- Form fields match the live `AISystemRiskAssessmentCreate` schema (verified in `reports/live-openapi.json`): required `ai_system_id` (dropdown populated from the org's real AI systems via `GET /api/v1/ai-systems`, shared `["ai-systems"]` query key), required `title`, required `assessment_type` (`initial | periodic | material_change | incident_followup | pre_deployment`), plus `risk_level` / `likelihood` / `impact` (`unknown|low|medium|high|critical`), optional `description` and `mitigation_summary`.
- POSTs to `/api/v1/ai-governance/ai-risk/assessments`; on success invalidates `["ai-risk-assessments"]` and `["ai-risk-assessments-summary"]` so the list, the "N assessments" badge, and the Risk Assessments / Drafts KPIs move without reload.
- Backend errors are surfaced verbatim in the form (422 detail flattening via `ApiError`); a **403 gets a distinct amber "Plan upgrade required" state** (relevant because the org is on the starter plan). This endpoint itself is NOT feature-gated — create succeeded live.

### 2. AI System CREATE + EDIT (AI Systems page — was render-only)
- "Register system" button in the **AI System Registry** card header + a pencil edit button on every registry row (`components/ai-systems/SystemsRegistry.tsx`), both opening `components/ai-systems/AiSystemFormModal.tsx` (create vs. prefilled edit mode).
- Fields match the live `app__schemas__ai_system__AISystemCreate/Update` schemas: `name`*, `system_type`* (`internal_model|third_party_model|ai_feature|agent|workflow_automation|other`), `lifecycle_status` (`proposed|in_development|testing|production|retired|archived`), `deployment_environment`, `model_name`, `model_version`, `vendor_name`, `provider_name`, `intended_purpose`, `description`.
- `POST /api/v1/ai-systems` / `PATCH /api/v1/ai-systems/{id}`; mutations invalidate `["ai-systems"]`, `["ai-systems-summary"]`, `["ai-gov-dashboard"]`, `["ai-gov-scorecard"]`, and `["ai-system", id]` so KPIs, registry, Lifecycle Stages, and the detail page refresh without reload.

### 3. Shared modal primitive
- `components/ui/Modal.tsx` — glass-styled portal modal (backdrop blur, Escape/backdrop close, `IconTile` header, framer-motion enter/exit) consistent with `SectionCard`/`GlassCard`. No other agent had added one (`ls components/ui` checked first); reusable by other domains.

## Live verification evidence (scripts/verify-ai-systems.mjs)

All via real UI clicks (Playwright, headless Chromium), then backend GET confirmation. Raw values in `reports/completion-pass/sa4-ai-systems/evidence.json`.

| Flow | UI before → after (no reload) | Backend confirmation |
|---|---|---|
| Create assessment "SA4 verify assessment 1783790827558" (pre_deployment, risk medium, likelihood medium, impact high) against seeded system **Fraud Anomaly Detector** (`111e069a-8a3b-4f62-ab33-931b51fa3468`) | badge "0 assessments" → "1 assessments"; Risk Assessments KPI 0 → 1; new row rendered with Medium + draft badges | `GET /api/v1/ai-governance/ai-risk/assessments` contains id `5835b644-81f6-4e88-8a85-1449c93cd4f9` (status draft, pre_deployment, medium); `GET .../assessments/summary` → `total_assessments: 1, by_assessment_type: {pre_deployment: 1}` |
| Register system "SA4 Verify Triage Agent 1783790827558" (agent, in_development, aws-ap-south-1) | badge "4 systems" → "5 systems"; AI Systems KPI 5; row appears in registry | `GET /api/v1/ai-systems?search=SA4 Verify` returns id `b34ccc2a-0bbf-492b-80f0-ca568098e90b` |
| Edit that system: lifecycle in_development → testing (form prefill verified) | row badge flips to "testing"; Lifecycle Stages panel re-counts (in development 2→1, testing 1→2) without reload | same GET shows `lifecycle_status: "testing"` |

Screenshots (`reports/completion-pass/sa4-ai-systems/`):
- `01-assessment-modal-open.png`, `02-assessment-modal-filled.png`, `03-assessment-created-no-reload.png` (KPI + badge + row moved)
- `04-system-modal-filled.png`, `05-system-created-no-reload.png`, `06-system-edited-no-reload.png`

Console errors across all three flows: `[]`.

## Notes on the "ISO 42001 tracker" ask
The number that moves when an assessment is created is the **assessment tracker** (Risk Assessments KPI + "N assessments" badge + list) — verified 0→1 live. The separate "ISO 42001 Progress" KPI / "ISO/IEC 42001 Clauses" card reads `GET /api/v1/ai-governance/iso42001/summary`, which tracks **clause implementation** (0 of 30 clauses implemented), not assessment counts; creating an assessment correctly does not change clause status. No clause-status mutation endpoint exists in the live spec (only the GET summary), so that card stays honest read-only.

## Backend gaps / honest states
- No feature-gate hit on any endpoint I built against (assessment create, system create/patch all succeeded on the starter plan). The 403 upgrade-required UI state is implemented in both modals but was not triggerable live; `ai_policy_drafting` / `ai_risk_recommendations` (the known starter-plan-gated endpoints) are not part of these flows and no UI was built against them.
- `iso42001` clause tracking has no write endpoint (see above) — left read-only by design.

## Files touched (mine only)
- `components/ui/Modal.tsx` (new, shared)
- `components/ai-testing/CreateAssessmentModal.tsx` (new)
- `components/ai-testing/AiTestingTable.tsx` (button + modal wiring)
- `components/ai-systems/AiSystemFormModal.tsx` (new)
- `components/ai-systems/SystemsRegistry.tsx` (register button, per-row edit, modal wiring)
- `lib/api/ai-systems.ts` (createAiRiskAssessment, createAiSystem, updateAiSystem + enum consts/types from live schema)
- `lib/hooks/useAiTesting.ts` (`useCreateAiRiskAssessment`)
- `lib/hooks/useAiSystems.ts` (`useCreateAiSystem`, `useUpdateAiSystem`)
- `scripts/verify-ai-systems.mjs` (new, verification script)

Other modified files visible in `git status` belong to parallel agents and were not touched.
