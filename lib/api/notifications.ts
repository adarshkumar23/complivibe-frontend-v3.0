import { apiFetch, ApiError } from "@/lib/api/client";

/** Try endpoints in order; advance only on 404/405/501, otherwise surface the error. */
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

/** Notification feed — canonical paths only. Falls back to aggregated governance signals on 404. */
export function getNotifications() {
  return tryEndpoints(["/api/v1/notifications"]);
}

export function getNotificationsSummary() {
  return tryEndpoints(["/api/v1/notifications/summary"]);
}

/** Confirmed settings endpoint (also used by Settings page). */
export function getNotificationSettings() {
  return apiFetch<unknown>("/api/v1/notifications/settings");
}

/**
 * NOTE: No notification write/action endpoint (mark-read/resolve/snooze) is confirmed.
 * Action buttons in the UI are disabled — no mutations are issued.
 */
