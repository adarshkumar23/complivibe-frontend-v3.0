import {
  getStringFromPaths,
  getNumberFromPaths,
  getDateFromPaths,
  normalizeList
} from "@/lib/api/normalizers";

export { normalizeIntegrations } from "@/lib/api/settings-normalizers";
export type { Integration } from "@/lib/api/settings-normalizers";

/** Connection state classified from a REAL backend status string only — never supplied. */
const CONNECTED = ["connected", "active", "configured", "enabled", "linked", "ok", "live", "healthy", "synced"];
const FAILED = ["error", "failed", "disconnected", "revoked", "expired", "unauthor"];

export function isConnected(status: string | null): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return CONNECTED.some((x) => s.includes(x));
}

export function isFailed(status: string | null): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return FAILED.some((x) => s.includes(x));
}

export function statusTone(status: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!status) return "neutral";
  if (isFailed(status)) return "bad";
  if (isConnected(status)) return "good";
  if (/(pending|configuring|connecting|partial)/i.test(status)) return "warn";
  return "neutral";
}

/* ----------------------------- Sync logs ----------------------------- */
export type SyncLog = {
  id: string;
  provider: string | null;
  action: string | null;
  status: string | null;
  timestamp: string | null;
  message: string | null;
};

export function normalizeSyncLogs(value: unknown): SyncLog[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "data.items", "logs", "sync_logs", "events", "records"]).map((entry, index) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "log_id", "event_id"]) || `synclog-${index}`,
    provider: getStringFromPaths(entry, ["provider", "integration", "source", "service", "connector"]),
    action: getStringFromPaths(entry, ["action", "event", "operation", "type", "activity"]),
    status: getStringFromPaths(entry, ["status", "state", "result", "outcome"]),
    timestamp: getDateFromPaths(entry, ["timestamp", "created_at", "synced_at", "occurred_at", "date", "updated_at"]),
    message: getStringFromPaths(entry, ["message", "detail", "details", "description", "error"])
  }));
}

/** True when the synced status indicates failure. */
export function syncFailed(status: string | null): boolean {
  return isFailed(status);
}

/* ----------------------------- Provider summary ----------------------------- */
export type ProviderSummary = {
  status: string | null;
  configured: boolean | null;
  lastSync: string | null;
  recordCount: number | null;
  error: string | null;
  hasAny: boolean;
};

/** Generic provider summary reader — only fields the backend actually returns. */
export function normalizeProviderSummary(value: unknown): ProviderSummary {
  if (value == null) return { status: null, configured: null, lastSync: null, recordCount: null, error: null, hasAny: false };
  const status = getStringFromPaths(value, ["status", "state", "connection_status"]);
  const configuredStr = getStringFromPaths(value, ["configured", "connected", "enabled", "is_configured", "is_connected"]);
  const configured = configuredStr == null ? null : /^(true|1|yes|configured|connected|enabled)$/i.test(configuredStr.trim());
  const lastSync = getDateFromPaths(value, ["last_sync", "last_synced_at", "synced_at", "updated_at", "last_run"]);
  const recordCount = getNumberFromPaths(value, ["count", "total", "record_count", "repos", "tickets", "files", "messages", "items", "resources"]);
  const error = getStringFromPaths(value, ["error", "error_message", "last_error"]);
  const hasAny = [status, configured, lastSync, recordCount, error].some((v) => v != null);
  return { status, configured, lastSync, recordCount, error, hasAny };
}
