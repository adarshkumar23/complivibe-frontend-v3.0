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

/** Automation rules — canonical paths only. Degrade to an unavailable state if the backend lacks them. */
export function getAutomationRules() {
  return tryEndpoints(["/api/v1/automation/rules", "/api/v1/automation"]);
}

export function getAutomationRuns() {
  return tryEndpoints(["/api/v1/automation/runs", "/api/v1/jobs"]);
}

export function getAutomationStatus() {
  return tryEndpoints(["/api/v1/automation/status", "/api/v1/data-obs/automation/status"]);
}

/**
 * NOTE: No automation write/action endpoint (create/enable/disable/run-now) is confirmed.
 * Action buttons in the UI are disabled — no mutations are issued.
 */
