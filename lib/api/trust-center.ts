import { apiFetch } from "@/lib/api/client";

export function getTrustCenter() {
  return apiFetch<unknown>("/api/v1/trust-center");
}

export function getTrustCenterPublic() {
  return apiFetch<unknown>("/api/v1/trust-center/public");
}

export function getTrustCenterAssets() {
  return apiFetch<unknown>("/api/v1/trust-center/assets");
}

export function getTrustCenterMetrics() {
  return apiFetch<unknown>("/api/v1/trust-center/metrics");
}

export function publishTrustCenter() {
  return apiFetch<unknown>("/api/v1/trust-center/publish", { method: "POST", body: "{}" });
}

export function getCertifications() {
  return apiFetch<unknown>("/api/v1/certifications");
}
