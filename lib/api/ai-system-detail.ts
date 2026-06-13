import { apiFetch } from "@/lib/api/client";

const enc = (id: string) => encodeURIComponent(id);

export function getAiSystemDetail(id: string) {
  return apiFetch<unknown>(`/api/v1/ai-systems/${enc(id)}`);
}

export function getAiSystemDashboard(id: string) {
  return apiFetch<unknown>(`/api/v1/ai-systems/${enc(id)}/dashboard`);
}

export function getModelCard(id: string) {
  return apiFetch<unknown>(`/api/v1/ai-systems/${enc(id)}/model-card`);
}

export function getFactsheets(id: string) {
  return apiFetch<unknown>(`/api/v1/ai-systems/${enc(id)}/factsheets`);
}

export function getSystemEvidence(id: string) {
  return apiFetch<unknown>(`/api/v1/ai-systems/${enc(id)}/evidence`);
}

export function getViolations(id: string) {
  return apiFetch<unknown>(`/api/v1/ai-systems/${enc(id)}/violations`);
}

export function getTestingSummary(id: string) {
  return apiFetch<unknown>(`/api/v1/ai-systems/${enc(id)}/testing/summary`);
}

export function getLifecycleHistory(id: string) {
  return apiFetch<unknown>(`/api/v1/ai-systems/${enc(id)}/lifecycle-history`);
}

export function getOversight(id: string) {
  return apiFetch<unknown>(`/api/v1/ai-systems/${enc(id)}/oversight`);
}

export function getCostTelemetry(id: string) {
  return apiFetch<unknown>(`/api/v1/telemetry/cost/${enc(id)}`);
}

export function getDriftTelemetry(id: string) {
  return apiFetch<unknown>(`/api/v1/telemetry/drift/${enc(id)}`);
}

export function getReliabilityTelemetry(id: string) {
  return apiFetch<unknown>(`/api/v1/telemetry/reliability/${enc(id)}`);
}

/* ---- optional actions ---- */
export function generateModelCard(id: string) {
  return apiFetch<unknown>(`/api/v1/ai-systems/${enc(id)}/model-card`, { method: "POST", body: "{}" });
}

export function runAllTests(id: string) {
  return apiFetch<unknown>(`/api/v1/ai-systems/${enc(id)}/testing/run-all`, { method: "POST", body: "{}" });
}
