import { apiFetch } from "./client";

// ── GET /api/v1/auth/permissions ───────────────────────────────────────────
// The caller's REAL, org-scoped permission codes for their actual role in the
// org named by the X-Organization-ID header (which apiFetch sets). This is the
// same set the backend enforces via require_permission(...), so gating UI on
// these codes mirrors backend authorization exactly.
export type MyPermissions = {
  organization_id: string;
  permission_codes: string[];
};

export function getMyPermissions() {
  return apiFetch<MyPermissions>("/api/v1/auth/permissions");
}
