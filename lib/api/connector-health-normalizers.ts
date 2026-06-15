import { getStringFromPaths, getNumberFromPaths, getDateFromPaths, normalizeList } from "@/lib/api/normalizers";

/** Health states the UI understands. Anything unclassifiable falls back to "unknown". */
export type ConnectorState =
  | "healthy"
  | "degraded"
  | "stale"
  | "failing"
  | "permission_error"
  | "token_expired"
  | "rate_limited"
  | "unavailable"
  | "unknown";

export const STATE_LABEL: Record<ConnectorState, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  stale: "Stale",
  failing: "Failing",
  permission_error: "Permission error",
  token_expired: "Token expired",
  rate_limited: "Rate limited",
  unavailable: "Unavailable",
  unknown: "Unknown"
};

export function stateTone(state: ConnectorState): "good" | "warn" | "bad" | "neutral" {
  switch (state) {
    case "healthy":
      return "good";
    case "degraded":
    case "stale":
    case "rate_limited":
      return "warn";
    case "failing":
    case "permission_error":
    case "token_expired":
      return "bad";
    default:
      return "neutral";
  }
}

/** A "needs attention" state is anything that is neither healthy, unavailable, nor unknown. */
export function needsAttention(state: ConnectorState): boolean {
  return ["degraded", "stale", "failing", "permission_error", "token_expired", "rate_limited"].includes(state);
}

/** Classify a real backend status string into a known state — never invents a status. */
export function classifyState(raw: string | null): ConnectorState {
  if (!raw) return "unknown";
  const s = raw.toLowerCase();
  if (/token[_\s-]*expir|expired[_\s-]*token/.test(s)) return "token_expired";
  if (/permission|forbidden|unauthor|access[_\s-]*denied|\b403\b/.test(s)) return "permission_error";
  if (/rate[_\s-]*limit|throttl|\b429\b/.test(s)) return "rate_limited";
  if (/fail|error|broken|down|disconnect|revoked/.test(s)) return "failing";
  if (/stale|outdated|expired/.test(s)) return "stale";
  if (/degrad|partial|warning|warn/.test(s)) return "degraded";
  if (/unavailable|offline|not[_\s-]*connected|missing/.test(s)) return "unavailable";
  if (/healthy|ok|good|connected|active|live|nominal|\bup\b|synced/.test(s)) return "healthy";
  return "unknown";
}

export type Connector = {
  id: string;
  name: string;
  state: ConnectorState;
  /** the raw backend status string, for the visible label only (never an error/secret) */
  statusRaw: string | null;
  lastSync: string | null;
};

export type ConnectorHealth = {
  total: number | null;
  healthy: number | null;
  attention: number | null;
  unavailable: number | null;
  connectors: Connector[];
  /** true when the backend actually returned health information */
  hasSignal: boolean;
};

/** Read per-connector records from the list payload. Sensitive fields are intentionally ignored. */
function readConnectors(listData: unknown): Connector[] {
  return normalizeList(listData, [
    "",
    "data",
    "result",
    "items",
    "results",
    "connectors",
    "data.connectors",
    "data.items"
  ]).map((entry, index) => {
    const statusRaw = getStringFromPaths(entry, ["status", "state", "health", "health_status", "connection_status"]);
    return {
      id: getStringFromPaths(entry, ["id", "uuid", "connector_id", "provider_id"]) || `connector-${index}`,
      name:
        getStringFromPaths(entry, ["name", "connector", "provider", "integration", "source", "service", "type"]) ||
        "Connector",
      state: classifyState(statusRaw),
      statusRaw,
      lastSync: getDateFromPaths(entry, ["last_sync", "last_synced_at", "synced_at", "last_check", "checked_at", "updated_at"])
    };
  });
}

/**
 * Merge the summary + list payloads into one honest view.
 * Counts prefer explicit backend totals; otherwise they are derived from the connector list.
 * Returns hasSignal=false (→ honest empty state) when neither payload carries health data.
 */
export function normalizeConnectorHealth(summaryData: unknown, listData: unknown): ConnectorHealth {
  const connectors = readConnectors(listData);

  // Explicit aggregate counts if the summary endpoint provides them.
  const total = getNumberFromPaths(summaryData, ["total", "total_connectors", "count", "connectors", "summary.total"]);
  const healthy = getNumberFromPaths(summaryData, ["healthy", "healthy_count", "ok", "summary.healthy"]);
  const unavailable = getNumberFromPaths(summaryData, ["unavailable", "unavailable_count", "offline", "summary.unavailable"]);
  const attentionExplicit = getNumberFromPaths(summaryData, [
    "needs_attention",
    "attention",
    "degraded",
    "unhealthy",
    "issues",
    "failing"
  ]);

  // Derive from the list when the summary omits a field.
  const derivedTotal = connectors.length || null;
  const derivedHealthy = connectors.length ? connectors.filter((c) => c.state === "healthy").length : null;
  const derivedUnavailable = connectors.length ? connectors.filter((c) => c.state === "unavailable").length : null;
  const derivedAttention = connectors.length ? connectors.filter((c) => needsAttention(c.state)).length : null;

  const resolvedTotal = total ?? derivedTotal;
  const hasSignal = resolvedTotal != null || connectors.length > 0 || healthy != null || attentionExplicit != null;

  return {
    total: resolvedTotal != null ? Math.round(resolvedTotal) : null,
    healthy: healthy != null ? Math.round(healthy) : derivedHealthy,
    attention: attentionExplicit != null ? Math.round(attentionExplicit) : derivedAttention,
    unavailable: unavailable != null ? Math.round(unavailable) : derivedUnavailable,
    connectors,
    hasSignal
  };
}
