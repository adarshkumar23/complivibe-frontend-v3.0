import { apiFetch } from "@/lib/api/client";

export function getFrameworks() {
  return apiFetch<unknown>("/api/v1/frameworks");
}

export function getObligations() {
  return apiFetch<unknown>("/api/v1/obligations?limit=200");
}

export function getComplianceEvidence() {
  return apiFetch<unknown>("/api/v1/evidence?limit=100");
}

export function getRisks() {
  return apiFetch<unknown>("/api/v1/risks?limit=100");
}

export function getCertifications() {
  return apiFetch<unknown>("/api/v1/certifications");
}

export function getComplianceOverview() {
  return apiFetch<unknown>("/api/v1/compliance/overview");
}

export function getComplianceGaps() {
  return apiFetch<unknown>("/api/v1/compliance/gaps");
}

export function getComplianceScore() {
  return apiFetch<unknown>("/api/v1/compliance/score");
}

export function runProactiveScan() {
  return apiFetch<unknown>("/api/v1/intelligence/proactive/scan", { method: "POST", body: "{}" });
}
