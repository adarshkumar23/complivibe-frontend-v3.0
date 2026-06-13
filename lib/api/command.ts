import { apiFetch } from "@/lib/api/client";

export function getScoresSummary() {
  return apiFetch<unknown>("/api/v1/scores/summary");
}

export function getUnifiedHealthScore() {
  return apiFetch<unknown>("/api/v1/intelligence/unified-health-score");
}

export function getExecutiveSummary() {
  return apiFetch<unknown>("/api/v1/executive/summary");
}

export function getProactiveInsights() {
  return apiFetch<unknown>("/api/v1/intelligence/proactive/insights");
}

export function getPredictiveAlerts() {
  return apiFetch<unknown>("/api/v1/intelligence/predict/alerts");
}

export function getAiSystems() {
  return apiFetch<unknown>("/api/v1/ai-systems");
}

export function getEvidence() {
  return apiFetch<unknown>("/api/v1/evidence");
}

export function getRegulatoryDeadlines() {
  return apiFetch<unknown>("/api/v1/regulatory-intelligence/deadlines");
}

export function getControlCenterFeed() {
  return apiFetch<unknown>("/api/v1/enterprise/control-center-feed");
}
