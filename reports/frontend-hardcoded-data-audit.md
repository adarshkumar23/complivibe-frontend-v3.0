# Frontend Hardcoded-Data Audit — Alerts, Reports, Trust Center, Audit Pack, Questionnaires

**Date:** 2026-06-14
**Auditor scope:** the 5 credibility-sensitive pages and **every** component, hook, and `lib/api` normalizer they import.

## Method
- Read each page + all imported components, hooks, and `lib/api` (api + normalizers) files.
- Grepped the in-scope tree for: `mock|dummy|fake|staticData|testData|placeholder`, brand names (`Acme|Vanta|OneTrust`), framework literals (`SOC 2|ISO 27001`), status literals (`"Published"|"Approved"|"Connected"|"Completed"|"Healthy"|"Ready"`), `|| "…"` fallbacks, and numeric/percent literals (`95`, `99`, `0.95`, etc.).

## Headline result
The data layer is overwhelmingly clean: normalizers return `null` for absent fields and never invent rows, statuses, scores, dates, owners, or counts. UI consistently renders loading / empty / error / unavailable states. **No mock arrays, no brand/customer placeholders, no hardcoded scores or dates were found.**

**Two confirmed forbidden fabrications** were identified and fixed (see fixes report). A small number of borderline patterns are reported as observations (not changed).

---

## Confirmed FORBIDDEN findings (fixed)

### F1 — Alerts: unclassified alerts shown as severity "Info"
- **Module:** Alerts
- **Files / lines:**
  - `lib/api/normalizers.ts:171-194` — `normalizeSeverity()` returns `"info"` for any missing/unknown value; `normalizeAlerts()` had no "was severity actually present?" flag and even read `"type"` as a severity source.
  - `components/alerts/AlertFeed.tsx:111` — rendered `<SeverityBadge severity={a.severity} />` unconditionally → every unclassified alert displayed a blue **"Info"** badge.
  - `lib/api/alert-normalizers.ts:29-34` (`severityBreakdown`) — bucketed unclassified alerts into the **"Info"** slice of the donut chart.
- **Hardcoded value:** severity `"Info"` asserted when the backend sent no severity.
- **Allowed/Forbidden:** **Forbidden** — fabricates a business classification (severity) the backend never returned. Brief rule A: "If severity is missing, show 'Unknown' or 'Not classified'."
- **Backend endpoint:** `/api/v1/intelligence/proactive/insights`, `/api/v1/intelligence/predict/alerts` (`severity`/`priority`/`risk_level`/`level`).
- **Recommended fix:** Add a `hasSeverity` flag to `NormalizedAlert` (the exact pattern already used by risks, incidents, and AI-system violations) and render an "Unclassified" badge / exclude from the chart when false. **Done.**

### F2 — Trust Center: all assets counted as "Published" when no visibility/status field
- **Module:** Trust Center
- **File / line:** `components/trust-center/TrustKpis.tsx:22-23`
- **Hardcoded value (logic):** `published = anyVisibility ? filter(isPublished).length : assetList.length` — when no asset carries a visibility/status field, **every** asset was counted under the "Published Assets … shared publicly" KPI.
- **Allowed/Forbidden:** **Forbidden** — fabricates a "Published/Public" state. Brief rule C: "Do not fake 'Published', 'Live', 'Verified', or 'Public'."
- **Backend endpoint:** `/api/v1/trust-center/assets` (`visibility`/`status`).
- **Recommended fix:** Count only assets the backend marks published/public via `isPublished()`. **Done.**

---

## Borderline observations (reported, NOT changed)

These render **real counts of real backend records** — no fabricated rows/values — but apply a "when no status field exists, show the total instead of filtering" fallback. They are defensible (showing real data, avoiding a misleading `0`) and touch out-of-scope risk/incident endpoints, so they were left as-is per "fix only confirmed forbidden values."

| ID | File:line | Pattern | Why left as-is |
|----|-----------|---------|----------------|
| B1 | `components/reports/ReportReadiness.tsx:35,39` | `openRisks`/`openIncidents` fall back to total count when no status field | Real counts; "source data available to include" context; risks/incidents are out-of-scope endpoints |
| B2 | `components/trust-center/PublishedAssets.tsx:28-31` | When no dedicated assets, lists real reports/audit packs, labeled via subtitle "From reports & audit packs (no dedicated assets)" | Transparent fallback to **real** backend data, clearly labeled; no fake status asserted |
| B3 | `components/trust-center/CertificationsPanel.tsx:21-24` | When no certs, lists real frameworks, labeled "Active frameworks" | Transparent, clearly-labeled fallback to real data |

## Allowed static labels confirmed (kept)
Section titles & subtitles, tab/filter labels (`All`, `Critical/High/Medium/Low`, `All statuses`…), button labels (`Generate Report`, `Publish Trust Center`, `Request Auto-Answer`…), empty-state copy, input placeholders, KPI labels (`Completed`, `Published Assets`, `Audit Readiness`…), icon/color/path config maps, and `|| "—"` / `|| "No metadata"` row placeholders. None assert a business value.

## Files inspected
- **Pages (5):** `app/dashboard/{alerts,reports,trust-center,audit-pack,questionnaires}/page.tsx` (no `questionnaires/[id]/page.tsx` exists).
- **Hooks (5):** `lib/hooks/use{Alerts,Reports,TrustCenter,AuditPack,Questionnaires}.ts`.
- **API + normalizers:** `lib/api/{alerts via command,reports,reports normalizers,trust-center,trust-center normalizers,audit-pack,audit-pack normalizers,questionnaires,questionnaire normalizers}.ts` + shared `lib/api/normalizers.ts`, `lib/api/types.ts`.
- **Components (44):** all of `components/{alerts,reports,trust-center,audit-pack,questionnaires}/*`.
