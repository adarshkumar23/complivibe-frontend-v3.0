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

/** Canonical-only agent endpoints — graceful 404 to an unavailable state. */
export function getAgents() {
  return tryEndpoints(["/api/v1/agents"]);
}
export function getAgentRuns() {
  return tryEndpoints(["/api/v1/agents/runs", "/api/v1/jobs", "/api/v1/automation/runs"]);
}
export function getAgentTasks() {
  return tryEndpoints(["/api/v1/agents/tasks"]);
}
export function getAgentFindings() {
  return tryEndpoints(["/api/v1/agents/findings"]);
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
