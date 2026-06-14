# Search & Notifications — Hardcoded-Data Audit

**Date:** 2026-06-14
**Pages:** `/dashboard/search`, `/dashboard/notifications`

## Files inspected
- **Pages:** `app/dashboard/search/page.tsx`, `app/dashboard/notifications/page.tsx`
- **Components:** `components/search/*` (SearchHeader, SearchSourceCards, SearchExperience), `components/notifications/*` (NotificationsHeader, NotificationsKpis, NotificationFeed, NotificationSettingsPanel)
- **Hooks:** `lib/hooks/useGlobalSearch.ts`, `lib/hooks/useNotifications.ts`
- **API helpers:** `lib/api/search.ts`, `lib/api/notifications.ts`
- **Normalizers:** `lib/api/search-normalizers.ts`, `lib/api/notification-normalizers.ts`
- **Reused (already audited):** all module normalizers (ai-systems, evidence, risks, incidents, reports, audit-packs, questionnaires, trust-center, policies, vendors, regulatory, certifications, alerts, approvals, assurance, integrations, automation, workflows) + settings notification normalizer + shared `normalizers.ts`.

## Endpoint reality check
The backend matrix has **no** `/api/v1/search*` and **no** `/api/v1/notifications` (only `/api/v1/notifications/settings`, used by Settings). Per the brief, **search is built by aggregating real records from confirmed module endpoints**, and notifications **aggregate real governance signals** from confirmed sources (the dedicated `/api/v1/notifications` feed is used only if it returns data). No write/action endpoints exist → all mutate actions are disabled.

## Source aggregation strategy
- **Search:** `useGlobalSearch` fetches 18 confirmed module endpoints (`retry:false`), and `buildSearchIndex` maps each module's **existing audited normalizer** into a unified `SearchRecord` (title/type/status/owner/date/linkedResource/description + a real list route). Only sources that successfully returned data are indexed; per-source availability is tracked and surfaced. Client-side debounced filtering runs over real records — no server search is faked.
- **Notifications:** `useNotifications` prefers a dedicated feed when `/api/v1/notifications` returns rows (`normalizeNotificationFeed`); otherwise `buildSignals` aggregates real "governance signals" from alerts, incidents, risks, regulatory deadlines, approvals, assurance, questionnaires, **failed** sync logs, **failed** automation runs, and **blocked** workflows. The section is labeled "Governance Signals" (not "unread notifications") when aggregating, per the brief.

## Allowed static labels
- Page titles/subtitles, eyebrow labels, KPI labels, section titles, search/input placeholders, empty/error/unavailable copy, icons, tone/color maps.
- Category labels & list routes in `CATEGORY_META` / `SIGNAL_META` (static labels mapped to **real existing** dashboard routes).
- Filter chip labels — but **chip counts are real** (derived from indexed records / aggregated signals).
- Status-keyword classification arrays (`RESOLVED`, `HIGH`, …) used to interpret **real** backend strings.
- Action button labels (Mark all as read / Resolve / Snooze / Update) — all rendered **disabled**.

## Forbidden business values found
**None.** The grep for fabricated literals (`|| "unread/resolved/high/active/delivered/read"`, mock/dummy/fake) and for secret/token/webhook-URL fields returned no matches. No search results, notification rows, alert states, unread counts, timestamps, owners, priorities, due dates, or actions are hardcoded.

## Honest-data design decisions
- **Counts are backend-derived.** Search KPIs (Indexed sources / Searchable records / Available modules / Unavailable sources) come from real fetched data; unavailable sources are never counted as available. Notification KPIs (Open / High priority / Overdue / Recently resolved) derive from real signal fields.
- **No fabricated snippets / status / dates.** Result descriptions are shown only when the backend provides them; missing status is omitted; missing timestamps are omitted.
- **Severity/priority** shown only when real; never defaulted to Info/High/Critical.
- **Overdue / resolved** computed only from real due dates or explicit status — never inferred from missing data.
- **Result navigation** uses only real existing routes (module list pages; AI systems → `/dashboard/ai-systems/{id}`). When no route exists the Open button is disabled with `title="Target route unavailable"`.
- **No secrets.** The settings panel reads only channel **enabled** booleans + digest/threshold strings; webhook URLs and tokens are never read or displayed.
- **Unavailable states:** "Search sources unavailable from backend.", "Notification sources unavailable from backend.", "Notification settings unavailable from backend.", partial-source warning banner, no-query and no-results states.

## Endpoints used
**Search (confirmed sources):** `/api/v1/ai-systems`, `/api/v1/evidence?limit=100`, `/api/v1/risks?limit=100`, `/api/v1/incidents?limit=100`, `/api/v1/reports?limit=100`, `/api/v1/audit-packs?limit=100`, `/api/v1/questionnaires?limit=100`, `/api/v1/trust-center`, `/api/v1/certifications`, `/api/v1/regulatory-intelligence/deadlines`, `/api/v1/intelligence/predict/alerts` + canonical (graceful 404): policies, vendors, approvals, assurance, integrations, automation/rules, workflows.
**Notifications:** `/api/v1/notifications/settings` (confirmed); `/api/v1/notifications` (canonical, graceful 404); signal sources: predict/alerts, incidents, risks, regulatory deadlines, approvals, assurance, questionnaires, integrations/sync-logs, automation/runs (jobs), workflows.

## Unavailable endpoints
`/api/v1/search*` and `/api/v1/notifications` (+ `/summary`) are unconfirmed → search uses aggregation; notifications use aggregated signals. Canonical-only module endpoints (policies, vendors, approvals, assurance, automation, workflows, sync-logs) render as "unavailable sources" until the backend exposes them; the UI surfaces this in source-status messaging without faking results.

## Action endpoints — available vs unavailable
**All write actions unavailable** (no confirmed endpoints): Mark as read, Mark all as read, Resolve, Snooze, Update settings. Every action button is **disabled** with `title="Action endpoint unavailable"`; no success messages, no local-state mutation. **Read navigation** ("Open") is enabled only for real existing routes.

## Confirmation
No fake business data remains in either page. All search results and notification signals originate from backend APIs; aggregated signals are clearly labeled (not "unread"); secrets/tokens/webhook URLs are never displayed; disabled actions never fake success. `tsc --noEmit` is clean and `next build` succeeds with both new routes and all existing routes compiling.
