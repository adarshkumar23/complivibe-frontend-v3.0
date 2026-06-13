import { apiFetch } from "@/lib/api/client";

export function getAiSystems() {
  return apiFetch<unknown>("/api/v1/ai-systems");
}

export function getAiGovernanceSummary() {
  return apiFetch<unknown>("/api/v1/ai-governance/summary");
}

export function getGovernanceScore() {
  return apiFetch<unknown>("/api/v1/governance/score");
}

export function getAiSystem(id: string) {
  return apiFetch<unknown>(`/api/v1/ai-systems/${encodeURIComponent(id)}`);
}
