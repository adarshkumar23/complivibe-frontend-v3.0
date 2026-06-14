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

/** Canonical-only simulation endpoints — graceful 404 to an unavailable state. */
export function getSimulations() {
  return tryEndpoints([
    "/api/v1/simulations",
    "/api/v1/simulation",
    "/api/v1/scenario-simulation",
    "/api/v1/scenarios",
    "/api/v1/intelligence/scenarios"
  ]);
}
export function getImpactAnalysis() {
  return tryEndpoints(["/api/v1/intelligence/impact-analysis"]);
}

/** Confirmed source records used to populate selectable scenario inputs. */
export { getAiSystems } from "@/lib/api/ai-systems";
export { getRisks } from "@/lib/api/risks";
export { getIncidents } from "@/lib/api/incidents";
export { getRegulatoryDeadlines } from "@/lib/api/command";
export { getEvidenceList } from "@/lib/api/evidence";
export { getAuditPacks } from "@/lib/api/audit-pack";
export { getQuestionnaires } from "@/lib/api/questionnaires";

/**
 * NOTE: No simulation write/action endpoint (run/save/export/create-task) is confirmed.
 * Action buttons in the UI are disabled — no mutations are issued and no simulation output is fabricated.
 */
