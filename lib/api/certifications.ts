import { apiFetch } from "@/lib/api/client";

export function getCertifications() {
  return apiFetch<unknown>("/api/v1/certifications");
}
