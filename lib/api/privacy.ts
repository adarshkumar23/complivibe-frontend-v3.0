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

/** Canonical privacy endpoints — graceful 404 to an unavailable state. */
export function getPrivacySummary() {
  return tryEndpoints(["/api/v1/privacy/summary", "/api/v1/privacy", "/api/v1/dpdp"]);
}
export function getPrivacyRequests() {
  return tryEndpoints(["/api/v1/privacy/requests"]);
}
export function getPrivacyRetention() {
  return tryEndpoints(["/api/v1/privacy/retention"]);
}
export function getPrivacyDataMap() {
  return tryEndpoints(["/api/v1/privacy/data-map"]);
}

/** Confirmed real sources used to derive privacy posture. */
export { getDataObsSensitive } from "@/lib/api/data-observability";
export { getComplianceOverview, getComplianceEvidence } from "@/lib/api/compliance";
export { getRegulatoryDeadlines } from "@/lib/api/command";
export { getPolicies } from "@/lib/api/policies";
export { getTrustCenter } from "@/lib/api/trust-center";
export { getCertifications } from "@/lib/api/compliance";

/**
 * NOTE: No privacy write/action endpoint (create request/assign/export/update retention) is confirmed.
 * Action buttons in the UI are disabled — no mutations are issued. Raw PII is never read or rendered.
 */
