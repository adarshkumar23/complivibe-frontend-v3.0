# Regulatory Intelligence & Certifications — Hardcoded-Data Audit

**Date:** 2026-06-14
**Pages:** `/dashboard/regulatory`, `/dashboard/certifications`
**Scope:** all new pages, components, hooks, API helpers, and normalizers created for these two routes.

## Summary
Both pages render **business data from backend APIs only**. Every normalizer returns `null` for absent strings/numbers, `[]` for absent arrays, and never fabricates rows, statuses, scores, dates, deadlines, certification states, or counts. KPI counts compute only when the relevant query succeeded; otherwise the card shows an "Unavailable/Unknown" state. No `|| "Active"`-style fallbacks, no mock arrays, no brand/framework placeholder rows.

## Allowed static labels (kept)
- Page titles & subtitles, section titles/subtitles, `UPPERCASE` eyebrow labels ("Regulatory Watch", "Audit Readiness").
- KPI labels ("Active Frameworks", "Open Obligations", "Ready for Review", "Expiring Soon", …).
- Filter labels ("All frameworks", "All categories"), input placeholders, button labels ("View details", "Prepare evidence").
- Empty/error/unavailable copy (e.g. "No regulatory deadlines returned by backend.", "Evidence requirements unavailable from backend.").
- Icon names, accent/tone color maps, and status-keyword classification arrays (`HIGH_PRIORITY`, `READY`) used to interpret **real** backend strings — these classify returned values, they do not supply values.

## Forbidden business values found
**None.** No fabricated statuses, scores, percentages, dates, deadlines, owners, counts, certification states, brand names (Acme/Vanta/OneTrust), or framework rows (SOC 2 / ISO 27001) are hardcoded. The grep for risky literals returned only the two keyword-classification arrays and one doc comment.

## Design decisions that keep data honest
- **Severity/priority not fabricated:** a dedicated `normalizeRegulatoryObligations` was added (instead of reusing `normalizeObligations`, which defaults severity to `"info"`). Priority/status are raw backend strings, `null` when absent; the badge is only rendered when present.
- **Counts gated on success + real fields:** "Ready for Review" and "Expiring Soon" only count when the backend actually returns `status` / `expiry` fields (otherwise `null` → "No status field" / "No expiry dates"). KPIs do not default to `0`.
- **Readiness is real or absent:** `averageReadiness` averages only certs that report a readiness value; if none do, the panel shows an unavailable state rather than a computed/fake score.
- **Published/Certified never assumed:** `isReady` matches real status keywords only; certs with no status render a neutral "Status unknown" badge.
- **Actions disabled, never faked:** certification action buttons ("View details", "Prepare evidence") are rendered **disabled** with a tooltip, because no backend action endpoint is confirmed. No fake download/export URLs, no false success messages.

## Endpoints used
**Regulatory Intelligence**
- `/api/v1/regulatory-intelligence/deadlines` — deadlines timeline + KPIs.
- `/api/v1/regulatory-intelligence` — optional intelligence context (graceful 404 handling).
- `/api/v1/frameworks` — framework coverage + Active Frameworks KPI.
- `/api/v1/obligations?limit=200` — obligations impact table + Open Obligations KPI.
- `/api/v1/compliance/overview` — supplemental context.

**Certifications**
- `/api/v1/certifications` — certifications grid, KPIs, readiness, evidence mapping.
- `/api/v1/evidence?limit=100` — available evidence context.

All endpoints already existed in `lib/api/command.ts` / `lib/api/compliance.ts`; no new backend routes were invented.

## Remaining backend gaps (handled gracefully, never faked)
- **Certification actions** (view/prepare/export): no confirmed endpoint → buttons disabled with explanatory tooltip.
- **Per-certification evidence mapping**: shown only when `certifications` returns an `evidence_count`; otherwise "Evidence requirements unavailable from backend."
- **`/api/v1/regulatory-intelligence`**: if it 404s, the page relies on deadlines/frameworks/obligations; no section breaks.
- **Jurisdiction / linked obligation** on deadlines: rendered only when the backend includes those fields; absent → muted "No framework / jurisdiction".

## Validation
- `npx tsc --noEmit` → clean (exit 0).
- `npx next build` → success; `/dashboard/regulatory` and `/dashboard/certifications` compiled, all existing routes still build.
- No backend code changed.
