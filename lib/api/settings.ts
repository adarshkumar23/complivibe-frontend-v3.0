import { apiFetch, ApiError } from "@/lib/api/client";

/** Try endpoints in order; skip to the next only on 404/405/501, otherwise surface the error. */
async function tryEndpoints(paths: string[], init?: RequestInit): Promise<unknown> {
  let lastError: unknown;
  for (const path of paths) {
    try {
      return await apiFetch<unknown>(path, init);
    } catch (err) {
      lastError = err;
      if (err instanceof ApiError && [404, 405, 501].includes(err.status)) continue;
      throw err;
    }
  }
  throw lastError;
}

export function getSettings() {
  return apiFetch<unknown>("/api/v1/settings");
}

export function getProfile() {
  return tryEndpoints(["/api/v1/me", "/api/v1/profile"]);
}

export function getOrganization() {
  return apiFetch<unknown>("/api/v1/organization");
}

export function getTeam() {
  return tryEndpoints(["/api/v1/team", "/api/v1/members"]);
}

export function getIntegrations() {
  return apiFetch<unknown>("/api/v1/integrations");
}

export function getApiKeys() {
  return apiFetch<unknown>("/api/v1/api-keys");
}

export function getNotificationSettings() {
  return apiFetch<unknown>("/api/v1/notifications/settings");
}

export function getSecuritySettings() {
  return apiFetch<unknown>("/api/v1/security/settings");
}

/* ---- updates (real; never faked) ---- */
export function updateOrganization(payload: Record<string, unknown>) {
  return tryEndpoints(["/api/v1/organization"], { method: "PATCH", body: JSON.stringify(payload) }).catch((err) => {
    if (err instanceof ApiError && err.status === 405) {
      return apiFetch("/api/v1/organization", { method: "PUT", body: JSON.stringify(payload) });
    }
    throw err;
  });
}

export function updateNotificationSettings(payload: Record<string, unknown>) {
  return apiFetch<unknown>("/api/v1/notifications/settings", { method: "PATCH", body: JSON.stringify(payload) });
}
