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

/** Assurance cases — canonical paths only. Degrades to an unavailable state if the backend lacks them. */
export function getAssuranceCases() {
  return tryEndpoints(["/api/v1/assurance-ext/cases", "/api/v1/assurance/reviews", "/api/v1/assurance"]);
}

export function getAssuranceSummary() {
  return tryEndpoints(["/api/v1/assurance-ext/summary", "/api/v1/assurance/summary"]);
}

/**
 * NOTE: No assurance write/action endpoint (sign-off/request-changes/escalate/assign) is confirmed.
 * Action buttons in the UI are therefore disabled — no mutations are issued.
 */
