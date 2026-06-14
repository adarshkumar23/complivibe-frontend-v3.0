import { apiFetch, ApiError } from "@/lib/api/client";

/** Try endpoints in order; advance only on 404/405/501, otherwise surface the error. */
async function tryEndpoints(paths: string[], init?: RequestInit): Promise<unknown> {
  let lastError: unknown;
  for (const path of paths) {
    try {
      return await apiFetch<unknown>(path, init);
    } catch (err) {
      lastError = err;
      if (err instanceof ApiError && [404, 405, 501].includes(err.status)) continue;
      throw err;
    }
  }
  throw lastError;
}

/** Confirmed score sources (also used by Command Center / Compliance). */
export { getScoresSummary, getUnifiedHealthScore, getExecutiveSummary } from "@/lib/api/command";
export { getComplianceOverview, getComplianceScore } from "@/lib/api/compliance";
export { getGovernanceScore, getAiGovernanceSummary } from "@/lib/api/ai-systems";

/** Optional dedicated explanation endpoint — canonical only, graceful 404. */
export function getScoreExplain() {
  return tryEndpoints(["/api/v1/scores/explain", "/api/v1/intelligence/score-explainer", "/api/v1/score-explainer"]);
}

/** Source records used to derive drivers when no official explanation exists. */
export { getComplianceEvidence, getRisks } from "@/lib/api/compliance";
export { getIncidents } from "@/lib/api/incidents";
export { getRegulatoryDeadlines } from "@/lib/api/command";
export { getApprovals } from "@/lib/api/approvals";
export { getAssuranceCases } from "@/lib/api/assurance";
export { getQuestionnaires } from "@/lib/api/questionnaires";
export { getTrustCenter } from "@/lib/api/trust-center";
export { getVendors } from "@/lib/api/vendor-risk";
export { getAiSystems } from "@/lib/api/ai-systems";
