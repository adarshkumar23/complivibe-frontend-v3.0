# Vendor Risk & Policies — Hardcoded-Data Audit

**Date:** 2026-06-14
**Pages:** `/dashboard/vendor-risk`, `/dashboard/policies`

## Files inspected
- **Pages:** `app/dashboard/vendor-risk/page.tsx`, `app/dashboard/policies/page.tsx`
- **Components:** `components/vendor-risk/*` (Header, Kpis, Table, ReviewPipeline, EvidenceLinkage), `components/policies/*` (Header, Kpis, Library, FrameworkMapping, Templates)
- **Hooks:** `lib/hooks/useVendorRisk.ts`, `lib/hooks/usePolicies.ts`
- **API helpers:** `lib/api/vendor-risk.ts`, `lib/api/policies.ts`
- **Normalizers:** `lib/api/vendor-risk-normalizers.ts`, `lib/api/policy-normalizers.ts`
- **Reused (already audited):** `compliance-normalizers.ts` (frameworks/obligations), `evidence-normalizers.ts`.

## Endpoint reality check
The backend endpoint matrix (`reports/backend-endpoint-matrix.csv`) does **not** list `/api/v1/vendors`, `/api/v1/vendor-risk`, `/api/v1/policies`, or `/api/v1/policies/templates` (the backend repo is absent, so no endpoint is independently confirmed). Rather than invent paths, the helpers call the **canonical paths named in the brief** and degrade gracefully (a 404 surfaces as a query error → the UI renders an unavailable/error state). Supplementary panels use **confirmed** endpoints so the pages still show real data even if the primary vendor/policy endpoints are absent.

## Allowed static labels (kept)
- Page titles/subtitles, eyebrow labels ("Third-Party Oversight", "Governance Library").
- KPI labels ("Vendors Tracked", "High-Risk Vendors", "Policies Tracked", "Under Review", …).
- Section titles/subtitles, filter labels ("All categories", "All risk levels", "All frameworks", "All statuses"), input placeholders.
- Pipeline stage labels (Pending review / In review / Approved / Blocked / Needs evidence) — these are **display labels for counts derived from real backend status strings**, shown only when at least one vendor has a status.
- Action button labels (View / Review / Request update / Export), empty/error/unavailable copy, icons, tone/color maps, and status-keyword classification arrays (`HIGH_RISK`, status regexes) used to interpret **real** backend values.

## Forbidden business values found
**None.** The grep for fabricated literals (`|| "Active"`, `|| "High"`, mock/dummy/fake, Acme/Vanta/OneTrust, SOC 2 / ISO 27001, "Privacy Policy"/"AI Policy"/"Security Policy") returned no matches. No vendor names, policy names, statuses, scores, dates, owners, versions, counts, or risk levels are hardcoded.

## Honest-data design decisions
- **Counts gated on real fields + query success:** High-Risk Vendors, Reviews Due, Evidence-Linked, Policies Under Review, Linked-to-Frameworks, and Reviews Due only compute when the backend actually returns the relevant field (`riskLevel`, `nextReview`/`status`, `evidenceCount`, `framework`). Otherwise the card shows an "Unavailable / No … data" state — never `0`.
- **Risk levels / statuses never fabricated:** badges render only when the backend supplies `risk_level` / `status`; classification (`isHighRisk`, tones) interprets the real string, never supplies one.
- **Review pipeline is real or absent:** `vendorPipeline` returns `null` (→ unavailable state) when no vendor carries a status; stage counts come only from real status strings.
- **Vendor evidence linkage uses real tags:** only evidence items whose `type`/`title`/`control` actually mention vendor/third-party/supplier/contract/DPA are shown; if none, "Vendor evidence mapping unavailable from backend."
- **Framework mapping uses real records:** obligation-per-framework counts come from real `/api/v1/obligations`; if `/api/v1/frameworks` returns nothing, "Policy-to-framework mapping unavailable from backend."
- **Templates not hardcoded:** rendered only from `/api/v1/policies/templates`; no fallback template names. Error/empty → unavailable state.
- **Actions disabled, never faked:** View / Review / Request update are disabled (no backend action endpoint) with an explanatory tooltip. Export is a real link only when the policy carries a backend `url`; otherwise disabled. No fake download URLs, no false success messages.

## Endpoints used
**Vendor Risk**
- `/api/v1/vendors` → `/api/v1/vendor-risk` (canonical, graceful 404) — vendor registry + KPIs + pipeline.
- `/api/v1/vendor-risk/summary` (canonical, graceful 404) — optional summary context.
- `/api/v1/evidence?limit=100` (confirmed) — vendor evidence linkage.
- `/api/v1/risks?limit=100`, `/api/v1/questionnaires?limit=100` (confirmed) — supplementary context.

**Policies**
- `/api/v1/policies` (canonical, graceful 404) — policy library + KPIs.
- `/api/v1/policies/templates` (canonical, graceful 404) — templates panel.
- `/api/v1/frameworks`, `/api/v1/obligations?limit=200`, `/api/v1/compliance/overview` (confirmed) — framework/obligation mapping.
- `/api/v1/evidence?limit=100` (confirmed) — supplementary context.

No new backend routes invented; no backend code changed.

## Backend gaps (handled gracefully, never faked)
- **Vendor/policy primary endpoints** not present in the known matrix → pages render premium unavailable/error states until the backend exposes them.
- **Vendor actions / policy actions** (view/review/request-update): no endpoints → buttons disabled with tooltip.
- **Policy export:** only when the backend returns a real `url`.
- **Per-vendor / per-policy linkage counts:** shown only when the backend includes the count fields.

## Confirmation
No fake business data remains in either page. All vendor/policy business values originate from backend APIs; absent data renders loading/empty/error/unavailable states. `tsc --noEmit` is clean and `next build` succeeds with both new routes and all existing routes compiling.
