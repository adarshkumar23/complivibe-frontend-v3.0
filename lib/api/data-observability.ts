import { apiFetch } from "@/lib/api/client";

export function getDataObsOverview() {
  return apiFetch<unknown>("/api/v1/data-obs/overview");
}

export function getDataObsSources() {
  return apiFetch<unknown>("/api/v1/data-obs/sources");
}

export function getDataObsPipelines() {
  return apiFetch<unknown>("/api/v1/data-obs/pipelines");
}

export function getDataObsQuality() {
  return apiFetch<unknown>("/api/v1/data-obs/quality");
}

export function getDataObsFreshness() {
  return apiFetch<unknown>("/api/v1/data-obs/freshness");
}

export function getDataObsSensitive() {
  return apiFetch<unknown>("/api/v1/data-obs/sensitive-data");
}

export function getDataObsRag() {
  return apiFetch<unknown>("/api/v1/data-obs/rag");
}

export function getDataObsCatalog() {
  return apiFetch<unknown>("/api/v1/data-obs/catalog");
}
