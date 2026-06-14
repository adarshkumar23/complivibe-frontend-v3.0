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

/** Workflows — canonical paths only. Degrade to an unavailable state if the backend lacks them. */
export function getWorkflows() {
  return tryEndpoints(["/api/v1/workflows"]);
}

export function getWorkflowRuns() {
  return tryEndpoints(["/api/v1/workflows/runs"]);
}

/**
 * NOTE: No workflow write/action endpoint (start/assign/request-changes/approve/escalate) is confirmed.
 * Action buttons in the UI are disabled — no mutations are issued.
 */
