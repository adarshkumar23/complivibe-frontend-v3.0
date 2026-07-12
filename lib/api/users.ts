import { apiFetch } from "@/lib/api/client";

/**
 * Users API — typed against the live backend schema (/api/v1/users).
 */

// ── GET /api/v1/users (UserRead[]) ──────────────────────────────────────────
export type OrgUser = {
  id: string;
  created_at: string;
  updated_at: string;
  email: string;
  full_name: string | null;
  status: string;
  is_active: boolean;
  is_superuser: boolean;
};

export function getOrgUsers(limit = 200) {
  return apiFetch<OrgUser[]>(`/api/v1/users?limit=${limit}`);
}
