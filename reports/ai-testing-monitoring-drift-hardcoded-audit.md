# AI Testing, Monitoring & Drift — Hardcoded-Data Audit

**Date:** 2026-06-14
**Pages:** `/dashboard/ai-testing`, `/dashboard/ai-monitoring`, `/dashboard/drift`

## Files inspected
- **Pages:** `app/dashboard/ai-testing/page.tsx`, `app/dashboard/ai-monitoring/page.tsx`, `app/dashboard/drift/page.tsx`
- **Components:** `components/ai-testing/*` (Header, Kpis, Table, ResponsibleAiChecks, ViolationsFindings), `components/ai-monitoring/*` (Header, Kpis, MonitoringOverviewTable, AlertsIncidentsFeed, SystemReliabilityPanel), `components/drift/*` (Header, Kpis, DriftOverviewTable, DriftSignalsPanel, GovernanceImpact)
- **Hooks:** `lib/hooks/useAiTesting.ts`, `lib/hooks/useAiMonitoring.ts`, `lib/hooks/useDrift.ts`
- **API helpers:** `lib/api/ai-testing.ts`, `lib/api/ai-monitoring.ts`, `lib/api/drift.ts`
- **Normalizers:** `lib/api/ai-testing-normalizers.ts`, `lib/api/ai-monitoring-normalizers.ts`, `lib/api/drift-normalizers.ts`
- **Reused (already audited):** `ai-system-normalizers.ts`, `ai-system-detail-normalizers.ts` (testing/violations/telemetry), `risk-normalizers.ts`, `incident-normalizers.ts`, shared `normalizers.ts`.

## Endpoints used (all confirmed in the backend endpoint matrix; none invented)
- `/api/v1/ai-systems` — system registry (all three pages).
- `/api/v1/ai-systems/{id}/testing/summary` — per-system testing (AI Testing).
- `/api/v1/ai-systems/{id}/violations` (available via helper), `/api/v1/risks?limit=100`, `/api/v1/incidents?limit=100` — findings.
- `/api/v1/telemetry/reliability/{id}`, `/api/v1/telemetry/cost/{id}` — monitoring telemetry.
- `/api/v1/telemetry/drift/{id}` — drift telemetry.
- `/api/v1/intelligence/predict/alerts` — alerts feed.
- `/api/v1/ai-governance/summary`, `/api/v1/governance/score` — optional governance context.

Per-system telemetry/testing endpoints are fetched with React Query `useQueries` keyed by the real system id, with `retry: false` so a 404 surfaces immediately as a per-row "unavailable" state. No backend code changed; no endpoint paths altered.

## Allowed static labels (kept)
- Page titles/subtitles, eyebrow labels ("Model Assurance", "Live Oversight", "Behavior Watch").
- KPI labels, section titles/subtitles, search placeholders, empty/error/unavailable copy.
- Responsible-AI check **labels** (Fairness, Bias, Robustness, Explainability, Privacy, Security, Human oversight, Data quality) — these are the names of fields read from the backend; a check renders only when the backend returns a real status or score for it.
- Pipeline/severity tone & color maps, icons, and status-keyword classification arrays (`isTestPassed/Failed`, `HIGH_DRIFT`, reliability thresholds) used to interpret **real** backend values — they never supply a value.

## Forbidden business values found
**None.** The grep for fabricated literals (`|| "Passed/Failed/Healthy/Stable/High"`, mock/dummy/fake, Acme/Vanta/OneTrust, SOC 2 / ISO 27001) returned no matches. No AI systems, test results, scores, drift values, incidents, owners, statuses, dates, or counts are hardcoded.

## Honest-data design decisions
- **All KPIs gate on query success + real fields.** Tested/Passed/Failed/Needing-review counts derive only from per-system testing summaries that actually returned (`anyTesting`); reliability/drift counts require real telemetry (`anyReliability`/`anyDrift`). When the relevant data is absent, cards show "Unavailable / No … data" — never `0`.
- **No fabricated pass/fail/safe/stable.** Test status, reliability status, and drift status/severity are read verbatim from the backend; tone helpers only color real strings.
- **Severity never defaulted.** Alerts and drift signals use the established `hasSeverity` flag and render an **"Unclassified"** badge when the backend gives no severity (never Info/High/Critical).
- **Per-system unavailability is explicit.** Rows show "Testing summary unavailable", "Telemetry unavailable", or "Drift telemetry unavailable" when an endpoint 404s for that system.
- **Panels degrade cleanly.** Responsible-AI checks → unavailable when no testing data; System reliability → "Reliability telemetry unavailable from backend."; Drift signals → empty/unavailable; Governance impact → "Governance impact mapping unavailable from backend." when no linked risks/incidents.
- **Aggregates use only real values** (e.g., average reliability/RAI distribution computed across systems that actually reported, with the reporting count shown).

## Backend gaps (handled gracefully, never faked)
- **Per-system telemetry/testing endpoints** may be unavailable per system → row- and panel-level unavailable states.
- **Responsible-AI sub-checks** depend on the testing summary shape; only present checks render.
- **Drift signal arrays / recommended actions** render only when the drift payload includes them.
- No action/mutation buttons were added on these pages (read-only analytics), so there are no disabled-action or fake-URL concerns.

## Confirmation
No fake business data remains in any of the three pages. Every AI system, test result, telemetry value, drift signal, alert, incident, score, date, and count originates from backend APIs; absent data renders loading/empty/error/unavailable states. `tsc --noEmit` is clean and `next build` succeeds with all three new routes and all existing routes compiling.
