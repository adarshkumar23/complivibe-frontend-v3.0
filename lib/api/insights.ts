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

/** Confirmed proactive insights endpoint, with canonical fallbacks. */
export function getProactiveInsights() {
  return tryEndpoints(["/api/v1/intelligence/proactive/insights", "/api/v1/proactive-insights", "/api/v1/insights"]);
}

/** Real source records used to derive insights when no backend insight feed is available. */
export { getPredictiveAlerts, getRegulatoryDeadlines } from "@/lib/api/command";
export { getComplianceEvidence, getRisks } from "@/lib/api/compliance";
export { getIncidents } from "@/lib/api/incidents";
export { getQuestionnaires } from "@/lib/api/questionnaires";
export { getAiSystems } from "@/lib/api/ai-systems";
export { getApprovals } from "@/lib/api/approvals";
export { getAssuranceCases } from "@/lib/api/assurance";
export { getTrustCenter } from "@/lib/api/trust-center";

/**
 * NOTE: No insight write/action endpoint (assign/resolve/create-task/export) is confirmed.
 * Action buttons in the UI are disabled — no mutations are issued.
 */
