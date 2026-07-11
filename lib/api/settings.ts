import { apiFetch, ApiError } from "@/lib/api/client";
import type { MyOrganization } from "@/lib/api/auth";
export { getMyOrganizations } from "@/lib/api/auth";
export type { MyOrganization };

/**
 * Settings API — typed against the live backend schema
 * (/api/v1/organizations/*, /api/v1/memberships, /api/v1/sessions, /api/v1/sso-configs…).
 */

// ── GET /api/v1/memberships ─────────────────────────────────────────────────
export type Membership = {
  id: string;
  user_id: string;
  role_id: string | null;
  role_name: string | null;
  status: string;
  created_at: string;
  user: { id: string; email: string; full_name: string | null; status: string; is_active: boolean } | null;
};

export function getMemberships() {
  return apiFetch<Membership[]>("/api/v1/memberships");
}

// ── GET /api/v1/organizations/custom-roles ──────────────────────────────────
export type CustomRole = {
  id: string;
  name: string;
  description: string | null;
  is_system_role: boolean;
  is_active: boolean;
  permission_codes: string[];
};

export function getCustomRoles() {
  return apiFetch<CustomRole[]>("/api/v1/organizations/custom-roles");
}

// ── GET /api/v1/sessions ────────────────────────────────────────────────────
export type SessionInfo = {
  id: string;
  user_id: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at?: string | null;
  expires_at?: string | null;
  [key: string]: unknown;
};

export function getSessions() {
  return apiFetch<SessionInfo[]>("/api/v1/sessions");
}

// ── SSO / OIDC config state (404 = not configured) ─────────────────────────
async function orNull<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export function getSsoConfig() {
  return orNull(() => apiFetch<Record<string, unknown>>("/api/v1/sso-configs"));
}

export function getOidcConfig() {
  return orNull(() => apiFetch<Record<string, unknown>>("/api/v1/oidc-configs"));
}

// ── GET /api/v1/organizations/ip-allowlist ──────────────────────────────────
export type IpRange = {
  id: string;
  cidr?: string | null;
  description?: string | null;
  is_active?: boolean | null;
  [key: string]: unknown;
};

export function getIpAllowlist() {
  return apiFetch<IpRange[]>("/api/v1/organizations/ip-allowlist");
}

// ── GET /api/v1/organizations/ai-configuration ──────────────────────────────
export type AiConfiguration = {
  id: string;
  use_byo_credentials: boolean;
  is_active: boolean;
  groq_api_key_configured: boolean;
  azure_api_key_configured: boolean;
  azure_endpoint: string | null;
  azure_deployment_name: string | null;
};

export function getAiConfiguration() {
  return apiFetch<AiConfiguration>("/api/v1/organizations/ai-configuration");
}
