# Integrations & Webhooks — Hardcoded-Data Audit

**Date:** 2026-06-14
**Pages:** `/dashboard/integrations`, `/dashboard/webhooks`

## Files inspected
- **Pages:** `app/dashboard/integrations/page.tsx`, `app/dashboard/webhooks/page.tsx`
- **Components:** `components/integrations/*` (Header, Kpis, ProviderStatusGrid, SyncLogsPanel), `components/webhooks/*` (Header, Kpis, WebhookEndpointsTable, DeliveryLogPanel, EventCatalogPanel, WebhookSecurityPanel)
- **Hooks:** `lib/hooks/useIntegrations.ts`, `lib/hooks/useWebhooks.ts`
- **API helpers:** `lib/api/integrations.ts`, `lib/api/webhooks.ts`
- **Normalizers:** `lib/api/integration-normalizers.ts`, `lib/api/webhook-normalizers.ts`
- **Reused (already audited):** `settings-normalizers.ts` (`normalizeIntegrations` / `Integration`), shared `normalizers.ts`.

## Endpoint reality check
The backend endpoint matrix lists only `/api/v1/integrations` (used by Settings). Every other integration sub-endpoint (status, sync-logs, storage, per-provider summaries) and **all** webhook endpoints are absent, and **no write/action endpoints** exist. Following the established pattern, helpers call the **canonical paths named in the brief** with `retry:false` and graceful 404 handling → each surface degrades to a clean unavailable state. `/api/v1/integrations` is the one confirmed data source and drives the provider grid + KPIs.

## Allowed static labels / provider names (kept)
- Page titles/subtitles, eyebrow labels.
- KPI labels, section titles/subtitles, empty/error/unavailable copy, icons, tone/color maps.
- **Provider names** (GitHub, Slack, Jira, Google Workspace, Microsoft, AWS, Storage, Other) and their icons — these are static labels; **all status/sync/record data per provider comes from the backend**, shown as "Not configured" when absent.
- Action button labels (Connect/Configure/Re-sync/Disconnect/Create/Edit/Disable/Rotate secret/Retry) — all rendered **disabled**.
- Status-keyword classification arrays (`CONNECTED`, `FAILED`, delivery/webhook regexes) used to interpret **real** backend strings.

## Forbidden business values found
**None.** The grep for fabricated literals (`|| "Connected/Active/Configured/Synced/Delivered/Failed"`, mock/dummy/fake) returned only two doc comments. No connected integrations, provider statuses, sync counts, webhook URLs, delivery statuses, dates, owners, or event counts are hardcoded.

## Secret / token safety
- **No tokens or secrets are ever read or rendered.** The webhook normalizer reads only a signing **status** field (`signing_enabled`/`has_secret`), never a secret value.
- Webhook URLs are passed through `safeUrl()`, which strips query strings so any token riding in a URL is never displayed (host + path only).
- The security panel shows signing/rotation/retry/auth **metadata** only, with "Secrets are never displayed" helper copy.

## Honest-data design decisions
- **KPIs gate on real fields + query success** (Connected/Configured/Recent syncs/Failed syncs; Active webhooks/Deliveries/Failed/Event types). No defaulting to `0`; "Unavailable / No status field" otherwise. Webhook KPIs prefer the real summary endpoint, else derive from real lists.
- **Provider status never fabricated.** Each provider resolves from the real `/api/v1/integrations` entry and/or its per-provider summary; absent → "Not configured". AWS 404 degrades to "Not configured" (no crash) via `retry:false` + try/catch.
- **"Other" tile** shows only integration entries not matched by a named provider — never a duplicated/borrowed row.
- **Sync logs / deliveries / events / security** render real records only; missing endpoints show the specified unavailable copy (e.g. "Webhook delivery logs unavailable from backend.").

## Endpoints used
**Integrations:** `/api/v1/integrations` (confirmed); `/api/v1/integrations/status`, `/api/v1/integrations/sync-logs`, `/api/v1/storage/status`→`/stats`, and per-provider `…/github|slack|jira|google|microsoft|aws…` summaries (canonical, graceful 404).
**Webhooks:** `/api/v1/webhooks`, `/api/v1/webhooks/deliveries`, `/api/v1/webhooks/events`, `/api/v1/webhooks/summary` (canonical, graceful 404).

## Unavailable endpoints
All except `/api/v1/integrations` are unconfirmed in the matrix and will render unavailable states until the backend exposes them: integration status/sync-logs/storage, all per-provider summaries (incl. AWS), and all four webhook endpoints.

## Action endpoints — available vs unavailable
**All write actions unavailable** (no confirmed endpoints): Connect, Configure, Re-sync, Disconnect (Integrations); Create webhook, Edit, Disable, Rotate secret, Retry delivery (Webhooks). Every action button is **disabled** with `title="Action endpoint unavailable"`; no success messages, no local-state mutation pretending the backend changed.

## Confirmation
No fake business data remains in either page. All integration/provider/webhook business values originate from backend APIs; secrets/tokens are never displayed; disabled actions never fake success. `tsc --noEmit` is clean and `next build` succeeds with both new routes and all existing routes compiling.
