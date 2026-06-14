# Security & Privacy — Hardcoded-Data Audit

**Date:** 2026-06-14
**Pages:** `/dashboard/security`, `/dashboard/privacy`

## Files inspected
- **Pages:** `app/dashboard/security/page.tsx`, `app/dashboard/privacy/page.tsx`
- **Components:** `components/security/*` (Header, Kpis, AccessRbacPanel, ApiKeysPanel, AuditActivityPanel, ProductionHealthPanel, SecurityGapsPanel), `components/privacy/*` (Header, Kpis, Actions, PrivacyReadinessPanel, DataMapPanel, PrivacyRequestsPanel, PrivacyPoliciesEvidence, RegulatoryDeadlinePanel)
- **Hooks:** `lib/hooks/useSecurity.ts`, `lib/hooks/usePrivacy.ts`
- **API helpers:** `lib/api/security.ts`, `lib/api/privacy.ts`
- **Normalizers:** `lib/api/security-normalizers.ts`, `lib/api/privacy-normalizers.ts`
- **Reused (already audited):** Settings normalizers (`normalizeApiKeys` — masked only, `normalizeTeam`, `normalizeSecurity`), data-observability `sensitiveSignals`, policy/evidence/regulatory normalizers, `score-explainer-normalizers.scoreFrom`.

## Endpoint reality check
**Confirmed in matrix:** `/api/v1/api-keys`, `/api/v1/security/settings`, `/api/v1/team`, `/api/v1/members`, `/api/v1/organization`, `/api/v1/data-obs/sensitive-data`. Other security/privacy endpoints (security/summary, audit-logs, health/ready/live, production-readiness, security-scan, privacy/*, dpdp, data-map) are **canonical only** → fetched with `retry:false` and graceful 404 → unavailable states. Confirmed shared sources: compliance/overview, evidence, policies, regulatory deadlines, trust-center, certifications.

## Allowed static labels
Titles/subtitles/eyebrows, KPI/section labels, health/severity/sensitivity tone maps, icons, layout, action button labels (disabled where noted), data-map signal labels (PII findings / Exposure risks / Access anomalies / Retention items — these label real **counts**, not values). None assert a business value.

## Forbidden business values found
**None.** The grep for fabricated literals (`|| 0`, `|| "secure/compliant/certified/healthy"`, mock/dummy/fake) and for secret/PII fields (`api_key`, `.token`, `secret_value`, `raw_key`, `ssn`) returned no matches.

## Secret / PII safety
- **API keys:** rendered via the audited `normalizeApiKeys` which exposes only a **masked** display string — raw key/token values are never read or shown.
- **Audit logs:** only actor/action/resource/outcome/timestamp are shown; no payloads/secrets.
- **Sensitive data / data map:** only category, sensitivity **level**, source, count, and status (metadata) are shown — never raw PII values.
- No webhook URLs, tokens, or credentials are read or displayed anywhere.

## Security data strategy
- **Posture KPI** from backend score only (`security/summary`, `security/settings`); "Unavailable" otherwise (never 0).
- **Members / API keys / audit events** counted from real records (active counts only when a real status field exists).
- **Production health** reads real status fields (health/readiness/backup/monitoring/scan); "Unavailable" when absent — never asserts "secure".
- **Security gaps** derived only from explicit real signals: `mfa_enabled === false`, `audit_logging === false`, monitoring/backup status that is genuinely bad, and real scan findings. Never inferred from missing data; never invents vulnerabilities.

## Privacy data strategy
- **Readiness KPI/panel** from backend privacy/compliance score + readiness fields; "readiness" language only — never claims "compliant/certified" unless the backend status says so.
- **Evidence / sensitive signals / open actions** derived from real evidence records, real `data-obs/sensitive-data` signal counts, and real privacy request statuses.
- **Data map** shows real categories/sensitivity metadata only.
- **Requests & retention / policies & evidence / regulatory deadlines** from real records; clear unavailable copy when endpoints 404.

## Endpoints used
**Security:** api-keys, security/settings, team→members, organization (confirmed); security/summary, audit-logs, health/ready/live, system/production-readiness, system/security-scan (canonical, graceful 404).
**Privacy:** data-obs/sensitive-data (confirmed); privacy/summary→privacy→dpdp, privacy/requests, privacy/retention, privacy/data-map (canonical, graceful 404); compliance/overview, evidence, policies, regulatory deadlines, trust-center, certifications (confirmed/canonical).

## Unavailable endpoints
All canonical-only endpoints above render unavailable states until the backend exposes them; nothing is fabricated. Confirmed endpoints (api-keys, security settings, team, sensitive-data, evidence, regulatory) drive the real data shown today.

## Action endpoints — available vs unavailable
- **Available (read navigation only):** Privacy "View evidence / View policies", regulatory "All".
- **Unavailable (disabled):** Rotate / Disable key, Invite user, Export audit logs (Security); Create privacy request, Update retention policy, Export privacy pack (Privacy). All disabled with `title="Action endpoint unavailable"`. No fake success, no local-state mutation.

## Confirmation
No fake business data remains in either page. Scores are backend-only or "Unavailable"; members/keys/audit/sensitive/requests come from real records; **no raw API keys, tokens, secrets, webhook URLs, or PII are displayed** (keys masked, sensitive data shown as metadata only); disabled actions never fake success. `tsc --noEmit` is clean and `next build` succeeds with both new routes and all existing routes compiling.
