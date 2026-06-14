# Frontend Hardcoded-Data Fixes — Alerts, Reports, Trust Center, Audit Pack, Questionnaires

**Date:** 2026-06-14

## 1. Total files inspected
**59** — 5 pages, 5 hooks, ~9 page-specific api/normalizer files + 2 shared (`normalizers.ts`, `types.ts`), and 44 components (every component imported by the 5 pages). There is no `questionnaires/[id]/page.tsx`.

## 2. Total findings
**5** — 2 confirmed forbidden (fixed), 3 borderline observations (reported, not changed).

## 3. Forbidden hardcoded values found
1. **Alerts** — unclassified alerts displayed as severity **"Info"** (badge + severity donut), and `"type"` was wrongly read as a severity source.
2. **Trust Center** — **"Published Assets"** KPI counted *all* assets as published when no `visibility`/`status` field was returned.

## 4. Forbidden hardcoded values fixed
Both. Implementation mirrors the codebase's existing `hasSeverity` convention (already used by risks, incidents, AI-system violations).

| Fix | Change |
|-----|--------|
| F1 | `NormalizedAlert` gained `hasSeverity: boolean`; `normalizeAlerts` now sets it from real `severity`/`priority`/`risk_level`/`level` only (dropped `"type"`). `AlertFeed` renders an **"Unclassified"** neutral badge (and neutral tile) when `!hasSeverity`. `severityBreakdown` excludes unclassified alerts from the chart. |
| F2 | `TrustKpis` now counts `assetList.filter(isPublished).length` only — unmarked assets are no longer assumed published. |

No regression to out-of-scope consumers of `normalizeAlerts` (dashboard `OpenAlerts`, incidents `CriticalIncidents`, risks `PriorityRisks`): the added field is additive and `severity` still resolves to a valid value for their existing filters.

## 5. Allowed static labels kept
All section titles, tab/filter/button labels, empty-state copy, input placeholders, KPI labels, icon/color/path config maps, and `|| "—"` row placeholders — none assert a business value. (Full list in the audit report.)

## 6. Files changed
- `lib/api/types.ts` — added `hasSeverity` to `NormalizedAlert`.
- `lib/api/normalizers.ts` — `normalizeAlerts` sets `hasSeverity`; removed `"type"` from severity sources.
- `lib/api/alert-normalizers.ts` — `severityBreakdown` ignores unclassified alerts.
- `components/alerts/AlertFeed.tsx` — gated severity badge + tile accent on `hasSeverity`.
- `components/trust-center/TrustKpis.tsx` — published count uses `isPublished` only.
- `reports/frontend-hardcoded-data-audit.md`, `reports/frontend-hardcoded-data-fixes.md` — new.

No page routes, backend endpoint paths, layout, sidebar/topbar/mode-switcher, or API hooks were changed. No sections removed.

## 7. Endpoints used by each page
- **Alerts:** `/api/v1/intelligence/proactive/insights`, `/api/v1/intelligence/predict/alerts`, `/api/v1/enterprise/control-center-feed`, `/api/v1/regulatory-intelligence/deadlines` (+ risks/incidents/scores for context tiles).
- **Reports:** `/api/v1/reports?limit=100`, `/api/v1/reports/templates`, `/api/v1/reports/generate` (+ frameworks/ai-systems/evidence/risks/incidents/scores for readiness).
- **Trust Center:** `/api/v1/trust-center`, `/api/v1/trust-center/assets`, `/api/v1/trust-center/metrics`, `/api/v1/trust-center/publish`, `/api/v1/certifications` (+ reports/audit-packs/frameworks/ai-systems/evidence/risks/incidents/scores).
- **Audit Pack:** `/api/v1/audit-packs?limit=100` → `/api/v1/audit-packs` → `/api/v1/audit-pack` (fallback chain), `/api/v1/audit-pack(/s)/generate` (+ reports/evidence/frameworks/ai-systems/risks/incidents/scores).
- **Questionnaires:** `/api/v1/questionnaires?limit=100`, `/api/v1/questionnaires/templates`, `/api/v1/questionnaires/upload`, `/api/v1/questionnaires/answer` (+ compliance evidence).

## 8. Build / typecheck result
- `npx tsc --noEmit` → **exit 0** (clean).
- `npx next build` → **success**; all 18 routes compiled, including all 5 in-scope pages prerendered without error.
- Live browser smoke test against a real backend is not possible in this environment (no backend wired in). All 5 pages prerender successfully, confirming they render their loading/empty/error/unavailable states without runtime errors; with no backend reachable, each section falls through to its designed empty/error state — i.e. **no business values are shown when the backend is unavailable.**

## 9. Remaining backend gaps (handled gracefully, never faked)
- **Write actions** (`reports/generate`, `audit-pack/generate`, `questionnaires/upload` & `answer`, `trust-center/publish`) detect 404/405/501 and show an "unavailable" message instead of faking success.
- **Audit packs** use a 3-path fallback chain; if all 404, the library shows an error/empty state and the rest of the page still works.
- **Borderline count fallbacks** (B1–B3 in the audit) show real counts/records; left intentionally as documented.

## 10. Confirmation
Within the audited scope — which covered **every** page, component, hook, and normalizer used by Alerts, Reports, Trust Center, Audit Pack, and Questionnaires — the two confirmed forbidden fabrications (fake "Info" severity, assumed "Published" assets) have been removed. **No fake/hardcoded business rows, statuses, counts, scores, dates, owners, customer/brand names, or download/public URLs remain in these five pages.** Backend-provided demo data is displayed only when the API actually returns it; when the backend is unavailable, the pages show loading/empty/error/unavailable states only.
