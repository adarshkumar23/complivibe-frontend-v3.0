# Enterprise Control & Employee Compliance — Hardcoded-Data Audit

**Date:** 2026-06-14
**Pages:** `/dashboard/enterprise`, `/dashboard/employee-compliance`

## Files inspected
- **Pages:** `app/dashboard/enterprise/page.tsx`, `app/dashboard/employee-compliance/page.tsx`
- **Enterprise components:** `EnterpriseHeader`, `EnterpriseKpis`, `EnterpriseActions`, `OrgProfilePanel`, `TeamRbacPanel`, `ApiKeysAccessPanel`, `ProductionReadinessPanel`, `EnterpriseControlsPanel`
- **Employee-compliance components:** `EmployeeComplianceHeader`, `EmployeeComplianceKpis`, `EmployeeComplianceActions`, `EmployeeRosterPanel`, `PolicyAcknowledgementPanel`, `TrainingAttestationPanel`, `OverdueActionsPanel`, `PoliciesEvidencePanel`
- **Hooks:** `lib/hooks/useEnterpriseControl.ts`, `lib/hooks/useEmployeeCompliance.ts`
- **API helpers:** `lib/api/enterprise.ts`, `lib/api/employee-compliance.ts`
- **Normalizers:** `lib/api/enterprise-normalizers.ts`, `lib/api/employee-compliance-normalizers.ts`
- **Reused (already audited):** Settings normalizers (`normalizeOrganization`, `normalizeTeam`, `normalizeApiKeys` — masked only, `normalizeSecurity`, `normalizeIntegrations`, `normalizeDataPreferences`, `boolFrom`), Security `normalizeHealth`/`healthTone`, policy normalizers (`normalizePolicies`, `statusTone`), evidence `normalizeEvidenceItems`, `score-explainer-normalizers.scoreFrom`.

## Endpoint reality check
**Confirmed / already safely used:** `/api/v1/organization`, `/api/v1/team`→`/api/v1/members`, `/api/v1/api-keys`, `/api/v1/security/settings`, `/api/v1/integrations`, `/api/v1/settings`, `/api/v1/policies`, `/api/v1/evidence?limit=100`. **Canonical-only** (fetched with `retry:false`, graceful 404 → unavailable state): `/api/v1/enterprise/summary`→`/api/v1/enterprise`, `/api/v1/usage`→`/api/v1/billing`, `/api/v1/health`/`ready`/`live`, `/api/v1/system/production-readiness`, `/api/v1/audit-logs`, `/api/v1/employee-compliance/summary`→`/api/v1/employee-compliance`, `/api/v1/training`, `/api/v1/attestations`, `/api/v1/policy-acknowledgements`. No endpoint paths were invented or changed; no backend code was touched.

## Allowed static labels
Titles/subtitles/eyebrows, KPI/section labels, control-row labels (Multi-factor authentication, Single sign-on, Audit logging, Session timeout, IP allowlist, Data retention, Default framework, Human review required, Connected integrations), action button labels (disabled where noted), health/severity/compliance tone maps, the "Enabled"/"Disabled" rendering of real backend booleans, and the kind labels Training/Attestation/Acknowledgement used to tag real records. None assert a business value.

## Forbidden business values found
**None.** Grep for mock/fake arrays, email/token/secret literals (`sk_`, `pk_`, `Bearer`, `secret:`, `token:`), `|| 0` / `?? 0` defaults, and hardcoded `"compliant/certified/secure/healthy/passed"` claims returned no fabricated values. The only `?? 0` is the accumulator initializer inside `roleDistribution` (counting real member role records) — not a defaulted business value.

## Fixes made
No forbidden values were introduced, so no remediation was required. All counts are gated behind `isSuccess` so an unavailable endpoint yields "Unavailable" (never 0), and an empty successful list yields a real `0`/empty-state.

## Secret / private-data safety
- **API keys:** rendered via the audited `normalizeApiKeys` (masked display string only) — raw key/token/secret values are never read or shown.
- **Roster / RBAC:** only name, email, role, status, last-activity, and an explicit backend `compliance_status` are shown — no private user data beyond backend-safe metadata.
- **Audit / readiness:** only status fields and backend-provided warning messages are surfaced; no payloads, secrets, or webhook URLs.

## Enterprise data strategy
- **KPIs** — workspace members and active roles derived from the real team list (roles via `roleDistribution`); active API keys from real key records (active count only when a real status field exists); production readiness from a backend score only (`enterpriseReadinessScore`) → "Unavailable" otherwise, never invented.
- **Organization profile** (`normalizeWorkspace`) reads real name/slug/plan/status/region/industry/website/created fields; absent fields are hidden, and the whole panel shows an empty/unavailable state when nothing is present.
- **Production readiness** (`normalizeReadiness`) reads real health/readiness/backup/monitoring/scan/last-gate fields and a real warnings array; never asserts "ready/secure".
- **Enterprise controls** (`enterpriseControls`) surface only real security/retention/framework/integration settings; booleans render as Enabled/Disabled, missing values as "Unavailable"; the panel is empty when no real setting exists.

## Employee compliance data strategy
- **KPIs** — covered employees from the real roster; completed acknowledgements from real ack records (`isComplete`/`acknowledgedDate`); overdue actions only from real due dates in the past + non-complete status, or a backend overdue flag (`collectOverdue`/`isOverdue`); pending attestations from real attestation records. Each is "Unavailable" until its endpoint succeeds.
- **Roster** shows backend compliance status when present, otherwise a "Compliance status unavailable" note — status is never inferred.
- **Acknowledgements** show real records when available; when the endpoint is absent, the panel falls back to **linked policies as compliance material** (clearly labelled, never marked acknowledged).
- **Training/attestations & overdue** derive purely from real records; no completion percentages or progress are fabricated.
- **Policies & evidence** reuse audited policy/evidence normalizers (real counts only).

## Action endpoints — available vs unavailable
- **Available (read navigation only):** Enterprise → Workspace settings (`/dashboard/settings`), Security (`/dashboard/security`); Employee Compliance → View policies (`/dashboard/policies`), View evidence (`/dashboard/evidence`); plus in-panel "Policies" link. All target real existing routes.
- **Unavailable (disabled, `title="Action endpoint unavailable"`):** Invite user, Change role, Rotate key, Export audit logs (Enterprise); Assign training, Request acknowledgement, Send reminder, Export employee report (Employee Compliance). No fake success, no local-state mutation.

## Confirmation
No fake business data remains in either page. Scores are backend-only or "Unavailable"; members/roles/keys/readiness/controls and employees/acknowledgements/training/attestations/overdue all come from real records; **no raw API keys, tokens, secrets, webhook URLs, or private user data are displayed** (keys masked, roster limited to backend-safe metadata); disabled actions never fake success. `tsc --noEmit` is clean and `next build` succeeds with both new routes and all existing routes compiling.
