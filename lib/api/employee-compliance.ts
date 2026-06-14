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

/** Confirmed endpoints (already used elsewhere). */
export { getTeam } from "@/lib/api/settings";
export { getPolicies } from "@/lib/api/policies";
export { getEvidenceList } from "@/lib/api/evidence";

/** Canonical-only endpoints — graceful 404 to an unavailable state. */
export function getEmployeeComplianceSummary() {
  return tryEndpoints(["/api/v1/employee-compliance/summary", "/api/v1/employee-compliance"]);
}
export function getTraining() {
  return tryEndpoints(["/api/v1/training"]);
}
export function getAttestations() {
  return tryEndpoints(["/api/v1/attestations"]);
}
export function getPolicyAcknowledgements() {
  return tryEndpoints(["/api/v1/policy-acknowledgements"]);
}

/**
 * NOTE: No employee-compliance write/action endpoint (assign/request/remind/export) is confirmed.
 * Action buttons in the UI are disabled — no mutations are issued. Private user data beyond
 * backend-safe roster metadata is never rendered.
 */
