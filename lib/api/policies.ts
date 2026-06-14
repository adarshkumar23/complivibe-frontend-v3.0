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

/** Policy library — canonical path only. Degrades to an unavailable state if the backend lacks it. */
export function getPolicies() {
  return tryEndpoints(["/api/v1/policies"]);
}

export function getPolicyTemplates() {
  return tryEndpoints(["/api/v1/policies/templates"]);
}
