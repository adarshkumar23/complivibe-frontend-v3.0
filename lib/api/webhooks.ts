import { apiFetch } from "@/lib/api/client";

/**
 * Outbound webhook endpoints — /api/v1/compliance/webhook-endpoints*.
 *
 * Secret handling matches the recent security fix: the full signing secret is
 * only ever present in the response to POST (creation) — every subsequent
 * GET/list response returns it masked (e.g. "****...ab12"). There is no way
 * to recover the full secret after creation; deactivate and re-create if lost.
 */

export const WEBHOOK_EVENT_TYPES = [
  "control.failed",
  "risk.critical",
  "evidence.expired",
  "deadline.overdue",
  "issue.created",
  "alert.triggered"
] as const;
export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

export type WebhookEndpoint = {
  id: string;
  organization_id: string;
  url: string;
  name: string;
  secret: string;
  event_types: string[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type WebhookDelivery = {
  id: string;
  organization_id: string;
  endpoint_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  payload_hash: string;
  signature: string | null;
  status: string;
  attempts: number;
  last_attempted_at: string | null;
  delivered_at: string | null;
  response_code: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export function getWebhookEndpoints() {
  return apiFetch<WebhookEndpoint[]>("/api/v1/compliance/webhook-endpoints");
}

export function getWebhookEndpoint(endpointId: string) {
  return apiFetch<WebhookEndpoint>(`/api/v1/compliance/webhook-endpoints/${endpointId}`);
}

export function createWebhookEndpoint(body: { url: string; name: string; secret: string; event_types: string[] }) {
  return apiFetch<WebhookEndpoint>("/api/v1/compliance/webhook-endpoints", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function deactivateWebhookEndpoint(endpointId: string) {
  return apiFetch<WebhookEndpoint>(`/api/v1/compliance/webhook-endpoints/${endpointId}/deactivate`, {
    method: "POST"
  });
}

export function deleteWebhookEndpoint(endpointId: string) {
  return apiFetch<WebhookEndpoint>(`/api/v1/compliance/webhook-endpoints/${endpointId}`, {
    method: "DELETE"
  });
}

export function getWebhookDeliveries(endpointId: string) {
  return apiFetch<WebhookDelivery[]>(`/api/v1/compliance/webhook-endpoints/${endpointId}/deliveries`);
}

export function testEmitWebhook(eventType: string, testPayload: Record<string, unknown> = {}) {
  return apiFetch<WebhookDelivery[]>("/api/v1/compliance/webhook-endpoints/test-emit", {
    method: "POST",
    body: JSON.stringify({ event_type: eventType, test_payload: testPayload })
  });
}
