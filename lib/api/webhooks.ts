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

/** Webhook endpoints — canonical paths only. Degrade to an unavailable state if the backend lacks them. */
export function getWebhooks() {
  return tryEndpoints(["/api/v1/webhooks"]);
}

export function getWebhookDeliveries() {
  return tryEndpoints(["/api/v1/webhooks/deliveries"]);
}

export function getWebhookEvents() {
  return tryEndpoints(["/api/v1/webhooks/events"]);
}

export function getWebhookSummary() {
  return tryEndpoints(["/api/v1/webhooks/summary"]);
}

/**
 * NOTE: No webhook write/action endpoint (create/edit/disable/rotate-secret/retry) is confirmed.
 * Action buttons in the UI are disabled — no mutations are issued.
 */
