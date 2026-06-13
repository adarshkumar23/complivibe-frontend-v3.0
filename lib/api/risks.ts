import { apiFetch } from "@/lib/api/client";

export function getRisks() {
  return apiFetch<unknown>("/api/v1/risks?limit=100");
}
