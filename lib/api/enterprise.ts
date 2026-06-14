import { apiFetch, ApiError } from "@/lib/api/client";

/** Try endpoints in order; advance only on 404/405/501, otherwise surface the error. */
async function tryEndpoints(paths: string[]): Promise<unknown> {
  let lastError: unknown;
  for (const path of paths) {
    try {
      return await apiFetch<unknown>(path);
    } catch (err) {
      lastError = err;
      if (err instanceof ApiError && [404, 405, 501].includes(err.status)) continue;
      throw err;
    }
  }
  throw lastError;
}

/** Confirmed endpoints (already used by Settings / Security). */
export { getOrganization, getTeam, getApiKeys, getSecuritySettings, getIntegrations, getSettings } from "@/lib/api/settings";
export { getProductionReadiness, getHealth, getAuditLogs } from "@/lib/api/security";

/** Canonical-only endpoints — graceful 404 to an unavailable state. */
export function getEnterpriseSummary() {
  return tryEndpoints(["/api/v1/enterprise/summary", "/api/v1/enterprise"]);
}
export function getUsage() {
  return tryEndpoints(["/api/v1/usage", "/api/v1/billing"]);
}

/**
 * NOTE: No enterprise write/action endpoint (invite/change role/rotate/export/update workspace) is confirmed.
 * Action buttons in the UI are disabled — no mutations are issued. Raw key/token/secret values are never read.
 */
