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

// ════════════════ WRITES ════════════════

// ── Sessions: DELETE /api/v1/sessions/{id} (revoke) ─────────────────────────
export function revokeSession(sessionId: string) {
  return apiFetch<SessionInfo>(`/api/v1/sessions/${sessionId}`, { method: "DELETE" });
}

// ── IP allowlist writes (org:update) ────────────────────────────────────────
export function createIpRange(body: { cidr_range: string; label?: string | null }) {
  return apiFetch<IpRange>("/api/v1/organizations/ip-allowlist", { method: "POST", body: JSON.stringify(body) });
}
export function deleteIpRange(rangeId: string) {
  return apiFetch<IpRange>(`/api/v1/organizations/ip-allowlist/${rangeId}`, { method: "DELETE" });
}
export function disableIpAllowlist() {
  return apiFetch<IpRange[]>("/api/v1/organizations/ip-allowlist/disable", { method: "POST" });
}

// ── AI configuration: PUT /organizations/ai-configuration (compliance:write) ─
export type AiConfigInput = {
  use_byo_credentials: boolean;
  groq_api_key?: string | null;
  azure_api_key?: string | null;
  azure_endpoint?: string | null;
  azure_deployment_name?: string | null;
  is_active: boolean;
};
export function putAiConfiguration(body: AiConfigInput) {
  return apiFetch<AiConfiguration>("/api/v1/organizations/ai-configuration", { method: "PUT", body: JSON.stringify(body) });
}

// ── SAML SSO config writes (org:update) ─────────────────────────────────────
export type SsoConfigInput = {
  provider: string;
  entity_id: string;
  sso_url: string;
  slo_url?: string | null;
  certificate: string;
};
export function createSsoConfig(body: SsoConfigInput) {
  return apiFetch<Record<string, unknown>>("/api/v1/sso-configs", { method: "POST", body: JSON.stringify(body) });
}
export function updateSsoConfig(configId: string, body: Partial<SsoConfigInput>) {
  return apiFetch<Record<string, unknown>>(`/api/v1/sso-configs/${configId}`, { method: "PATCH", body: JSON.stringify(body) });
}
export function activateSsoConfig(configId: string) {
  return apiFetch<Record<string, unknown>>(`/api/v1/sso-configs/${configId}/activate`, { method: "POST" });
}
export function deactivateSsoConfig(configId: string) {
  return apiFetch<Record<string, unknown>>(`/api/v1/sso-configs/${configId}/deactivate`, { method: "POST" });
}
export function deleteSsoConfig(configId: string) {
  return apiFetch<void>(`/api/v1/sso-configs/${configId}`, { method: "DELETE" });
}
export function testSsoConfig(configId: string) {
  return apiFetch<Record<string, unknown>>(`/api/v1/sso-configs/${configId}/test`, { method: "POST" });
}

// ── OIDC config writes (org:update) ─────────────────────────────────────────
export type OidcConfigInput = {
  provider?: string;
  issuer_url: string;
  client_id: string;
  client_secret: string;
};
export function createOidcConfig(body: OidcConfigInput) {
  return apiFetch<Record<string, unknown>>("/api/v1/oidc-configs", { method: "POST", body: JSON.stringify(body) });
}
export function updateOidcConfig(configId: string, body: Partial<OidcConfigInput>) {
  return apiFetch<Record<string, unknown>>(`/api/v1/oidc-configs/${configId}`, { method: "PATCH", body: JSON.stringify(body) });
}
export function activateOidcConfig(configId: string) {
  return apiFetch<Record<string, unknown>>(`/api/v1/oidc-configs/${configId}/activate`, { method: "POST" });
}
export function deactivateOidcConfig(configId: string) {
  return apiFetch<Record<string, unknown>>(`/api/v1/oidc-configs/${configId}/deactivate`, { method: "POST" });
}
export function deleteOidcConfig(configId: string) {
  return apiFetch<void>(`/api/v1/oidc-configs/${configId}`, { method: "DELETE" });
}
export function testOidcConfig(configId: string) {
  return apiFetch<Record<string, unknown>>(`/api/v1/oidc-configs/${configId}/test`, { method: "POST" });
}
