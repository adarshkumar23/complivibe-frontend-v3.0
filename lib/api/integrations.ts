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

/** Confirmed integrations endpoint (also used by Settings). */
export function getIntegrations() {
  return apiFetch<unknown>("/api/v1/integrations");
}

export function getIntegrationStatus() {
  return tryEndpoints(["/api/v1/integrations/status"]);
}

export function getSyncLogs() {
  return tryEndpoints(["/api/v1/integrations/sync-logs"]);
}

export function getStorageStatus() {
  return tryEndpoints(["/api/v1/storage/status", "/api/v1/storage/stats"]);
}

/** Per-provider summaries — canonical paths only. Each degrades to "not configured" on 404. */
export function getGithubSummary() {
  return tryEndpoints(["/api/v1/integrations/github/summary", "/api/v1/integrations/github/repos"]);
}
export function getSlackSummary() {
  return tryEndpoints(["/api/v1/integrations/slack/configured", "/api/v1/integrations/slack/messages"]);
}
export function getJiraSummary() {
  return tryEndpoints(["/api/v1/integrations/jira/tickets"]);
}
export function getGoogleSummary() {
  return tryEndpoints(["/api/v1/integrations/google/workspace/summary", "/api/v1/integrations/google/drive/files"]);
}
export function getMicrosoftSummary() {
  return tryEndpoints(["/api/v1/integrations/microsoft/summary"]);
}
export function getAwsSummary() {
  return tryEndpoints(["/api/v1/integrations/aws/summary"]);
}

/**
 * NOTE: No integration write/action endpoint (connect/configure/re-sync/disconnect) is confirmed.
 * Action buttons in the UI are disabled — no mutations are issued.
 */
