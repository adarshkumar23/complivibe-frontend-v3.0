# Settings Page — Hardcoded / Fallback Business Value Audit

**Date:** 2026-06-14
**Scope:** `app/dashboard/settings/page.tsx`, `components/settings/*`, `lib/hooks/useSettings.ts`, `lib/api/settings.ts`, `lib/api/settings-normalizers.ts`
**Goal:** Ensure every business/product value rendered on the Settings page originates from a backend API. No fake data, no silent fallbacks to "Active/Connected/Enterprise/Enabled" or fabricated counts. Static UI labels are allowed.

---

## Summary

The Settings stack is largely well-built: the API layer (`settings.ts`) and the normalizers (`settings-normalizers.ts`) return `null` when a field is absent and never invent values. Most components already render proper loading / empty / error / unavailable states.

**Three forbidden fallbacks were found**, all in the status/summary surfaces:

| # | File | Line | Severity | Issue |
|---|------|------|----------|-------|
| 1 | `components/settings/SettingsStatusCards.tsx` | 63 | **Forbidden** | Workspace Status falls back to `"Active"` when the backend succeeds but returns no status |
| 2 | `components/settings/SettingsStatusCards.tsx` | 67 | **Forbidden** | "Active Integrations" count treats integrations with **no status** as active (`!i.status`) |
| 3 | `components/settings/IntegrationsPanel.tsx` | 48 | **Forbidden** | Integration badge falls back to `"Connected"` when the backend returns no status |

Everything else reviewed is compliant (details below).

---

## Findings

### 1. Workspace Status fallback to "Active" — FORBIDDEN

- **File:** `components/settings/SettingsStatusCards.tsx`
- **Line:** 60–63
- **Value found:**
  ```ts
  const workspaceStatus =
    getStringFromPaths(settings.data, ["status", "workspace_status", "plan", "state"]) ||
    getStringFromPaths(organization.data, ["status", "plan", "state"]) ||
    (settings.isSuccess || organization.isSuccess ? "Active" : null);
  ```
- **Classification:** Forbidden business data. If the request *succeeds* but the payload has no status field, the UI asserts the workspace is "Active" — a fabricated business value.
- **Backend source:** `/api/v1/settings` or `/api/v1/organization` (`status` / `workspace_status` / `plan` / `state`).
- **Recommended fix:** Drop the `"Active"` fallback. Leave `workspaceStatus` `null` when no real status is present so the card renders its existing "Unknown" unavailable state.

### 2. "Active Integrations" counts missing status as active — FORBIDDEN

- **File:** `components/settings/SettingsStatusCards.tsx`
- **Line:** 67
- **Value found:**
  ```ts
  const activeIntegrations = integrations.isSuccess
    ? integ.filter((i) => !i.status || /connect|active|enabled|ok|live/i.test(i.status)).length
    : null;
  ```
- **Classification:** Forbidden business data. `!i.status` means an integration with **no** status is counted as active/connected, inflating the connected count.
- **Backend source:** `/api/v1/integrations` (`status` / `state` / `connection_status`).
- **Recommended fix:** Only count integrations whose status is present **and** matches a real connected value. Remove the `!i.status` clause.

### 3. Integration badge fallback to "Connected" — FORBIDDEN

- **File:** `components/settings/IntegrationsPanel.tsx`
- **Line:** 48
- **Value found:**
  ```tsx
  <StatusBadge label={i.error ? "Error" : i.status || "Connected"} tone={tone(i.status, Boolean(i.error))} />
  ```
- **Classification:** Forbidden business data. When the backend returns no status, the badge displays "Connected".
- **Backend source:** `/api/v1/integrations` (`status`).
- **Recommended fix:** When `i.status` is absent, show `"Not configured"` (neutral tone) instead of `"Connected"`. The `tone()` helper already returns `neutral` for missing status, so only the label string changes.

---

## Reviewed and COMPLIANT (no change required)

| File | Why it is allowed |
|------|-------------------|
| `lib/api/settings.ts` | Real endpoint calls only. `tryEndpoints` only advances on 404/405/501; updates use real PATCH/PUT. No fake data. |
| `lib/api/settings-normalizers.ts` | All fields default to `null` when absent. `maskKey()` never renders a raw secret. Line 217 `"active"` is a **field path key** (reads a field named `active`), not a fallback value. `boolFrom` parses real values only. |
| `lib/hooks/useSettings.ts` | Thin React Query wrappers over the real endpoints. |
| `components/settings/SettingsHeader.tsx` | Pure static UI copy. Allowed. |
| `components/settings/ProfileWorkspace.tsx` | Renders real profile fields; shows "Not provided" per-row and a full empty/error state. No fabricated identity. |
| `components/settings/OrganizationSettings.tsx` | Real fields; empty/error states; real `updateOrganization`; gracefully marks save "unavailable" on 404/405/501. |
| `components/settings/TeamAccess.tsx` | Real members only; empty state when none; no fake rows/roles. |
| `components/settings/SecuritySettings.tsx` | `"Enabled"/"Disabled"` (line 19) are static labels **derived from a real boolean**; `null` renders "Unavailable". Does not assume MFA/SSO/audit on. |
| `components/settings/NotificationPreferences.tsx` | When unavailable, controls are disabled with an explicit read-only banner; does not persist assumed values. (Toggles default to off visually only while clearly marked unavailable.) |
| `components/settings/ApiKeysPanel.tsx` | Masked values only; empty state when none; no fake keys. |
| `components/settings/DataPreferences.tsx` | Real fields; "Unavailable" for nulls; empty state. |

---

## Backend endpoints used by the page

- `/api/v1/settings`
- `/api/v1/me` → `/api/v1/profile` (fallback chain on 404/405/501)
- `/api/v1/organization`
- `/api/v1/team` → `/api/v1/members` (fallback chain)
- `/api/v1/integrations`
- `/api/v1/api-keys`
- `/api/v1/notifications/settings`
- `/api/v1/security/settings`
