import { apiFetch, ApiError } from "@/lib/api/client";

/** Try endpoints in order; skip to the next only on 404/405/501, otherwise surface the error. */
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

export function getAuditPacks() {
  return tryEndpoints(["/api/v1/audit-packs?limit=100", "/api/v1/audit-packs", "/api/v1/audit-pack"]);
}

export type GenerateAuditPackInput = {
  framework?: string | null;
  ai_system?: string | null;
  date_from?: string | null;
  date_to?: string | null;
  include_evidence?: boolean;
  include_reports?: boolean;
  include_risks?: boolean;
  include_incidents?: boolean;
  include_model_cards?: boolean;
  include_governance_scores?: boolean;
};

export function generateAuditPack(input: GenerateAuditPackInput) {
  return tryEndpoints(["/api/v1/audit-pack/generate", "/api/v1/audit-packs/generate"], {
    method: "POST",
    body: JSON.stringify(input)
  });
}
