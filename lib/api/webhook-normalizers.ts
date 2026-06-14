import {
  getStringFromPaths,
  getNumberFromPaths,
  getDateFromPaths,
  getArrayFromPaths,
  normalizeList
} from "@/lib/api/normalizers";

/** Read a string array (e.g. event types) from any of the given paths. */
function stringArray(value: unknown, paths: string[]): string[] {
  for (const p of paths) {
    const arr = getArrayFromPaths(value, [p]);
    const strings = arr.filter((x): x is string => typeof x === "string");
    if (strings.length) return strings;
    // array of objects with name/type
    if (arr.length) {
      const named = arr
        .map((o) => getStringFromPaths(o, ["name", "type", "event", "label"]))
        .filter((v): v is string => Boolean(v));
      if (named.length) return named;
    }
  }
  return [];
}

/**
 * Webhook endpoint, normalized from /api/v1/webhooks.
 * URLs are shown only when the backend returns them; signing secrets are NEVER read or rendered.
 */
export type Webhook = {
  id: string;
  name: string;
  url: string | null;
  status: string | null;
  eventTypes: string[];
  lastDelivery: string | null;
  failureRate: number | null;
  owner: string | null;
  signingStatus: string | null;
};

const LIST_PATHS = ["", "data", "result", "items", "results", "data.items", "webhooks", "endpoints", "records"];

/** Show only the host of a URL — never query strings/tokens that may ride in the URL. */
function safeUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    return raw.split("?")[0];
  }
}

export function normalizeWebhooks(value: unknown): Webhook[] {
  return normalizeList(value, LIST_PATHS).map((entry, index) => {
    // signing status only — never the secret value itself
    const signingStr = getStringFromPaths(entry, ["signing_enabled", "signing", "secret_configured", "has_secret", "signed"]);
    return {
      id: getStringFromPaths(entry, ["id", "uuid", "webhook_id"]) || `webhook-${index}`,
      name: getStringFromPaths(entry, ["name", "title", "label", "description"]) || "Untitled webhook",
      url: safeUrl(getStringFromPaths(entry, ["url", "endpoint", "target_url", "callback_url", "destination"])),
      status: getStringFromPaths(entry, ["status", "state", "active"]),
      eventTypes: stringArray(entry, ["event_types", "events", "subscribed_events", "triggers"]),
      lastDelivery: getDateFromPaths(entry, ["last_delivery", "last_delivered_at", "last_event_at", "updated_at"]),
      failureRate: getNumberFromPaths(entry, ["failure_rate", "error_rate", "failed_rate"]),
      owner: getStringFromPaths(entry, ["owner", "created_by", "owner_name"]),
      signingStatus: signingStr
    };
  });
}

export function webhookStatusTone(status: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!status) return "neutral";
  const s = status.toLowerCase();
  if (/(disabled|inactive|error|failed|paused)/.test(s)) return "bad";
  if (/(active|enabled|live|healthy|true)/.test(s)) return "good";
  if (/(pending|degraded)/.test(s)) return "warn";
  return "neutral";
}

/* ----------------------------- Deliveries ----------------------------- */
export type WebhookDelivery = {
  id: string;
  eventType: string | null;
  destination: string | null;
  status: string | null;
  timestamp: string | null;
  responseCode: number | null;
  retryCount: number | null;
  error: string | null;
};

export function normalizeDeliveries(value: unknown): WebhookDelivery[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "data.items", "deliveries", "events", "records"]).map((entry, index) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "delivery_id"]) || `delivery-${index}`,
    eventType: getStringFromPaths(entry, ["event_type", "event", "type", "name"]),
    destination: getStringFromPaths(entry, ["destination", "url", "endpoint", "target", "webhook"]),
    status: getStringFromPaths(entry, ["status", "state", "result", "outcome"]),
    timestamp: getDateFromPaths(entry, ["timestamp", "delivered_at", "created_at", "occurred_at", "date"]),
    responseCode: getNumberFromPaths(entry, ["response_code", "status_code", "http_status", "code"]),
    retryCount: getNumberFromPaths(entry, ["retry_count", "retries", "attempts", "attempt"]),
    error: getStringFromPaths(entry, ["error", "error_message", "failure_reason", "message"])
  }));
}

export function deliveryTone(status: string | null, code: number | null): "good" | "warn" | "bad" | "neutral" {
  if (status) {
    const s = status.toLowerCase();
    if (/(fail|error|dropped|timeout)/.test(s)) return "bad";
    if (/(success|delivered|ok|200|2xx)/.test(s)) return "good";
    if (/(retry|pending|queued)/.test(s)) return "warn";
  }
  if (code != null) {
    if (code >= 200 && code < 300) return "good";
    if (code >= 400) return "bad";
  }
  return "neutral";
}

/* ----------------------------- Event catalog ----------------------------- */
export type WebhookEvent = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  enabled: boolean | null;
};

export function normalizeEvents(value: unknown): WebhookEvent[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "data.items", "events", "event_types", "catalog", "records"]).map((entry, index) => {
    const enabledStr = getStringFromPaths(entry, ["enabled", "active", "subscribed", "is_enabled"]);
    return {
      id: getStringFromPaths(entry, ["id", "uuid", "event_id", "key"]) || `event-${index}`,
      name: getStringFromPaths(entry, ["name", "type", "event", "title", "key"]) || "Event",
      description: getStringFromPaths(entry, ["description", "summary", "details", "help"]),
      category: getStringFromPaths(entry, ["category", "group", "domain", "module"]),
      enabled: enabledStr == null ? null : /^(true|1|yes|enabled|active|subscribed)$/i.test(enabledStr.trim())
    };
  });
}

/* ----------------------------- Summary & security ----------------------------- */
export type WebhookSummary = {
  active: number | null;
  deliveries: number | null;
  failed: number | null;
  eventTypes: number | null;
  hasAny: boolean;
};

export function normalizeWebhookSummary(value: unknown): WebhookSummary {
  const active = getNumberFromPaths(value, ["active", "active_webhooks", "active_count", "enabled_count"]);
  const deliveries = getNumberFromPaths(value, ["deliveries", "recent_deliveries", "delivery_count", "total_deliveries"]);
  const failed = getNumberFromPaths(value, ["failed", "failed_deliveries", "failed_count", "errors"]);
  const eventTypes = getNumberFromPaths(value, ["event_types", "event_type_count", "events", "events_count"]);
  const hasAny = [active, deliveries, failed, eventTypes].some((v) => v != null);
  return { active, deliveries, failed, eventTypes, hasAny };
}

export type WebhookSecurity = {
  signingEnabled: boolean | null;
  secretRotation: string | null;
  lastRotated: string | null;
  retryPolicy: string | null;
  authMethod: string | null;
  hasAny: boolean;
};

/** Security metadata only — the raw signing secret is never read or rendered. */
export function normalizeWebhookSecurity(value: unknown): WebhookSecurity {
  const signingStr = getStringFromPaths(value, ["signing_enabled", "signing", "signature_enabled", "signed"]);
  const signingEnabled = signingStr == null ? null : /^(true|1|yes|enabled|on)$/i.test(signingStr.trim());
  const secretRotation = getStringFromPaths(value, ["secret_rotation", "rotation_status", "rotation_policy", "secret_status"]);
  const lastRotated = getDateFromPaths(value, ["last_rotated", "secret_rotated_at", "rotated_at"]);
  const retryPolicy = getStringFromPaths(value, ["retry_policy", "retries", "retry_strategy", "backoff"]);
  const authMethod = getStringFromPaths(value, ["auth_method", "authentication", "auth", "signature_method"]);
  const hasAny = [signingEnabled, secretRotation, lastRotated, retryPolicy, authMethod].some((v) => v != null);
  return { signingEnabled, secretRotation, lastRotated, retryPolicy, authMethod, hasAny };
}
