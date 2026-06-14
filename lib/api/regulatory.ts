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

export function getRegulatoryDeadlines() {
  return apiFetch<unknown>("/api/v1/regulatory-intelligence/deadlines");
}

export function getRegulatoryIntelligence() {
  return tryEndpoints(["/api/v1/regulatory-intelligence"]);
}
