# Command Center Demo Coverage — Hardcoded-Data Audit

**Date:** 2026-06-14
**Scope:** `/dashboard` (Command Center) enhancement to surface the full seeded demo workspace using **real backend data only**.
**Constraint:** No backend changes, no fake data, no hardcoded seed counts, no fabricated scores, no mock rows.

---

## Files inspected

| File | Purpose |
|------|---------|
| `app/dashboard/page.tsx` | Command Center page composition |
| `components/dashboard/KpiRow.tsx` | Top KPI score cards |
| `components/dashboard/OpenAlerts.tsx` | Alerts panel |
| `components/dashboard/{CommandHeader,TrustOverview,HighRiskSystems,EvidenceFreshness,RegulatoryDeadlines}.tsx` | Existing sections |
| `lib/hooks/useCommandCenter.ts` | Existing command-center query hook |
| `lib/api/command.ts` | Command-center endpoint helpers |
| `lib/api/normalizers.ts` | Shared payload normalizers |
| `lib/api/{ai-systems,evidence,compliance,risks,incidents,reports,audit-pack,questionnaires,trust-center,policies,vendor-risk,approvals,assurance,insights,regulatory,certifications,integrations,data-observability}.ts` | Per-module endpoint helpers (for query-key reuse) |
| `lib/hooks/use*.ts` (module hooks) | Confirmed exact query keys for dedup |
| `components/providers.tsx` | React Query client config (`staleTime: 30_000`, `retry: 1`) |
| `components/ui/{StatCard,SectionCard,GlassCard,IconTile,SeverityBadge,accent}.tsx` | Existing UI primitives reused |

## Files added / changed

**Added**
- `lib/hooks/useGovernanceCoverage.ts` — real-count coverage hook (reuses module query keys).
- `components/dashboard/CoverageMap.tsx` — Governance Coverage Map grid + source status strip.
- `components/dashboard/QuickActions.tsx` — "Start Exploring" navigation row.

**Changed**
- `app/dashboard/page.tsx` — renders CoverageMap + QuickActions; passes coverage to KpiRow.
- `components/dashboard/KpiRow.tsx` — honest derived-coverage fallback when no score endpoint.
- `components/dashboard/OpenAlerts.tsx` — severity badge only shown when backend provides severity.
- `lib/api/normalizers.ts` — added `getCountFromPayload()` count helper.

---

## Endpoints used (real, via existing `/api/proxy` client)

| Module card | Endpoint | Query key (deduped with) |
|-------------|----------|--------------------------|
| AI Systems | `/api/v1/ai-systems` | `ai-systems` (command center, risks, reports…) |
| Evidence | `/api/v1/evidence?limit=100` | `cmp-evidence` (compliance, risks…) |
| Risks | `/api/v1/risks?limit=100` | `risks` |
| Incidents | `/api/v1/incidents?limit=100` | `incidents` |
| Reports | `/api/v1/reports?limit=100` | `reports` |
| Audit Packs | `/api/v1/audit-packs?limit=100` → `/audit-packs` → `/audit-pack` | `audit-packs` |
| Questionnaires | `/api/v1/questionnaires?limit=100` | `questionnaires` |
| Trust Center | `/api/v1/trust-center` | `trust-center` |
| Policies | `/api/v1/policies` | `policies` |
| Vendors | `/api/v1/vendors` → `/api/v1/vendor-risk` | `vendors` |
| Approvals | `/api/v1/approvals` → `/api/v1/approval-queue` | `approvals` |
| Assurance | `/api/v1/assurance-ext/cases` → `/assurance/reviews` → `/assurance` | `assurance-cases` |
| Alerts | `/api/v1/intelligence/predict/alerts` | `predictive-alerts` (command center) |
| Insights | `/api/v1/intelligence/proactive/insights` | `proactive-insights` (command center) |
| Deadlines | `/api/v1/regulatory-intelligence/deadlines` | `regulatory-deadlines` (command center) |
| Certifications | `/api/v1/certifications` | `certifications` |
| Integrations | `/api/v1/integrations` | `integrations` |
| Data Observability | `/api/v1/data-obs/overview` | `dataobs-overview` |
| (secondary) Sync logs | `/api/v1/integrations/sync-logs` | `integration-sync-logs` — feeds Integrations card sub-note only |

All requests go through the existing authenticated `apiFetch` → `/api/proxy/...` client (Bearer token from `localStorage`), so no new auth surface and no 401 regression.

---

## Count strategy (`getCountFromPayload`)

Per card, on a **successful** response:

1. If payload is an **array** → use `array.length`.
2. Else if payload carries a backend **total/count** field (`total`, `count`, `total_count`, `totalCount`, `total_items`, `pagination.total`, `meta.total`, `summary.total`) → use that number. (So a `limit=100` list that reports `total: 240` shows **240**, not 100.)
3. Else if payload embeds a list (`items`/`results`/`rows`/…) → use that list's length.
4. Else (config-style object with no list/total, e.g. Trust Center) → count is `null` → card shows **"Available"** with status *Records available* (no fabricated number).

Status mapping:
- query error / 404 → **Unavailable** (count never coerced to 0).
- success + count `> 0` → **Records available** + real number.
- success + count `= 0` (genuine empty array) → **No records returned**.
- success + count `null` → **Records available** ("Available", no number).

---

## Top KPI strategy (Part 2)

KPI cards (`Governance Health`, `Compliance Readiness`, `Data Health`, `Audit Readiness`) first try the **real** score endpoints/fields via `pickScore` over `scores/summary`, `unified-health-score`, `executive/summary`. **Only when no official score is found** do they show an honest derived-coverage caption built from real source-record counts:

- Governance Health → `Source records available · N AI systems`
- Compliance Readiness → `Coverage available · N source records` (evidence + risks + deadlines)
- Data Health → `Records available · N data sources` (data-obs overview)
- Audit Readiness → `Derived coverage available · N records` (audit packs + reports + evidence)
- If no source records exist either → neutral `Awaiting score endpoint`.

No score is ever invented, defaulted to 0, or labelled "ready".

---

## Unavailable endpoints

Handled **per endpoint, gracefully**: a failed/404 source renders an honest *Unavailable* badge and is counted in the source-status strip's "Unavailable sources" — it is **never** counted as 0 records and never blocks the other cards. Which specific endpoints are unavailable depends on the live demo backend at view time; the UI reflects real success/failure rather than any assumption.

---

## Source status strip (Part 5)

`Connected sources` / `Available records` / `Unavailable sources` are derived purely from the live success/failure and real counts of the 18 module queries above. No fabricated totals.

---

## Confirmations

- ✅ **No seeded counts are hardcoded.** Every number comes from a live endpoint payload via `getCountFromPayload`. Grep for digit-literals in the new files yields only layout/sizing classes and icon sizes — no record counts.
- ✅ **No fake scores added.** KPI fallbacks are text coverage captions derived from real counts; numeric scores still come only from real score endpoints.
- ✅ **No fabricated scores defaulted to 0.** Missing scores render `—` with an honest caption; missing counts render `Unavailable`, never 0.
- ✅ **No fake alerts added.** OpenAlerts uses only `predict/alerts` + `proactive/insights`; severity is shown only when the backend supplies it (`hasSeverity`); unavailable → clean error state.
- ✅ **No mock rows / fake data.** Coverage cards and quick actions are static module metadata (label/icon/route) only; all dynamic values are live.
- ✅ **No PDF/file counts fabricated** — no generated-PDF count is shown.
- ✅ **Performance:** shared React Query keys dedupe with module pages; `staleTime: 300_000` on coverage queries prevents refetch loops; queries degrade independently.
- ✅ **Design preserved:** reuses existing liquid-glass primitives (`GlassCard`, `IconTile`, `accent`); no routes changed; existing pages untouched.

---

## Validation

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✅ Pass (exit 0) |
| `npm run build` | ✅ Pass (exit 0, all routes; `/dashboard` 13 kB) |
