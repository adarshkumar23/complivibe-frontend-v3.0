import { apiFetch } from "@/lib/api/client";

/**
 * Connector Health — confirmed backend surface:
 *   GET /api/v1/compliance/connectors/health          (per-connector list)
 *   GET /api/v1/compliance/connectors/health/summary  (aggregate counts)
 * Only real backend payloads are relayed; nothing is fabricated.
 */
export function getConnectorHealthList() {
  return apiFetch<unknown>("/api/v1/compliance/connectors/health");
}

export function getConnectorHealthSummary() {
  return apiFetch<unknown>("/api/v1/compliance/connectors/health/summary");
}
