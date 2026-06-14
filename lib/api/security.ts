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

/** Confirmed endpoints (also used by Settings). */
export { getApiKeys, getSecuritySettings, getTeam, getOrganization, getProfile } from "@/lib/api/settings";

/** Canonical endpoints — graceful 404 to an unavailable state. */
export function getSecuritySummary() {
  return tryEndpoints(["/api/v1/security/summary"]);
}
export function getAuditLogs() {
  return tryEndpoints(["/api/v1/audit-logs"]);
}
export function getHealth() {
  return tryEndpoints(["/api/v1/health", "/api/v1/ready", "/api/v1/live"]);
}
export function getProductionReadiness() {
  return tryEndpoints(["/api/v1/system/production-readiness"]);
}
export function getSecurityScan() {
  return tryEndpoints(["/api/v1/system/security-scan"]);
}

/**
 * NOTE: No security write/action endpoint (rotate/invite/disable/export/update) is confirmed.
 * Action buttons in the UI are disabled — no mutations are issued. Raw key/token values are never read.
 */
