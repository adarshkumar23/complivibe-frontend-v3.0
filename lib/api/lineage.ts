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

/**
 * Dedicated lineage graph endpoint, if the backend exposes one. Canonical candidate paths only.
 * When none exist (all 404), the hook derives a lineage view from real cross-module records instead —
 * it never fabricates nodes or edges.
 */
export function getLineageGraph() {
  return tryEndpoints([
    "/api/v1/data-obs/lineage/graph",
    "/api/v1/data-obs/lineage",
    "/api/v1/data-lineage",
    "/api/v1/lineage"
  ]);
}

export function getDataObsSchemas() {
  return tryEndpoints(["/api/v1/data-obs/schemas"]);
}

export function getDataObsContracts() {
  return tryEndpoints(["/api/v1/data-obs/contracts"]);
}

export function getDataObsQualityIssues() {
  return tryEndpoints(["/api/v1/data-obs/quality/issues"]);
}
