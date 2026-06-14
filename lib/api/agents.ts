import { apiFetch, ApiError } from "@/lib/api/client";

/**
 * Try endpoints in order; advance on 404/405/422/501, otherwise surface the error.
 * 422 is included because this backend resolves unknown sub-paths (e.g. /agents/runs) against a
 * `/agents/{agent_id}` route and rejects them as an invalid UUID — i.e. the endpoint does not exist,
 * so we should fall through to the next candidate (e.g. /jobs) rather than error.
 */
const MISSING = [404, 405, 422, 501];

/**
 * Try endpoints in order; advance on missing-endpoint statuses, otherwise surface the error.
 * When `gracefulEmpty` is set and every candidate is a missing endpoint, resolve to an empty list
 * so optional panels show a clean empty state instead of a scary error.
 */
async function tryEndpoints(paths: string[], gracefulEmpty = false): Promise<unknown> {
  let lastError: unknown;
  for (const path of paths) {
    try {
      return await apiFetch<unknown>(path);
    } catch (err) {
      lastError = err;
      if (err instanceof ApiError && MISSING.includes(err.status)) continue;
      throw err;
    }
  }
  if (gracefulEmpty && lastError instanceof ApiError && MISSING.includes(lastError.status)) {
    return { items: [] };
  }
  throw lastError;
}

/** Canonical-only agent endpoints — graceful 404 to an unavailable state. */
export function getAgents() {
  return tryEndpoints(["/api/v1/agents"]);
}
export function getAgentRuns() {
  return tryEndpoints(["/api/v1/agents/runs", "/api/v1/jobs", "/api/v1/automation/runs"], true);
}
export function getAgentTasks() {
  return tryEndpoints(["/api/v1/agents/tasks"], true);
}
export function getAgentFindings() {
  return tryEndpoints(["/api/v1/agents/findings"], true);
}

/** Confirmed source / fallback endpoints. */
export { getProactiveInsights, getPredictiveAlerts } from "@/lib/api/command";
export { getApprovals } from "@/lib/api/approvals";
export { getAssuranceCases } from "@/lib/api/assurance";
export { getAiSystems } from "@/lib/api/ai-systems";
export { getEvidenceList } from "@/lib/api/evidence";
export { getRisks } from "@/lib/api/risks";
export { getQuestionnaires } from "@/lib/api/questionnaires";

/**
 * NOTE: No agent write/action endpoint (run/pause/assign/export) is confirmed.
 * Action buttons in the UI are disabled — no mutations are issued and no agent activity is fabricated.
 */
