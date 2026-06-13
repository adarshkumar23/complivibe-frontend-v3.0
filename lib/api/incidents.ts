import { apiFetch } from "@/lib/api/client";

export function getIncidents() {
  return apiFetch<unknown>("/api/v1/incidents?limit=100");
}
