import { apiFetch, ApiError } from "@/lib/api/client";

/**
 * Integrations API — typed against the live backend schema
 * (/api/v1/connectors/*, /api/v1/issue-sync/*, /api/v1/siem/config, /api/v1/email-config).
 */

// ── GET /api/v1/connectors/catalog ──────────────────────────────────────────
export type ConnectorCatalogEntry = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  config_schema: Record<string, unknown> | null;
  enabled: boolean;
  created_at: string | null;
};

export function getConnectorCatalog() {
  return apiFetch<ConnectorCatalogEntry[]>("/api/v1/connectors/catalog");
}

// ── GET /api/v1/connectors/enabled ──────────────────────────────────────────
export type EnabledConnector = {
  id: string;
  connector_id?: string | null;
  name?: string | null;
  status?: string | null;
  [key: string]: unknown;
};

export function getEnabledConnectors() {
  return apiFetch<EnabledConnector[]>("/api/v1/connectors/enabled");
}

// ── GET /api/v1/issue-sync/connections ──────────────────────────────────────
export type IssueSyncConnection = {
  id: string;
  provider?: string | null;
  status?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

export function getIssueSyncConnections() {
  return apiFetch<IssueSyncConnection[]>("/api/v1/issue-sync/connections");
}

// ── GET /api/v1/siem/config (404 = not configured) ──────────────────────────
export type SiemConfig = {
  id: string;
  provider?: string | null;
  is_active?: boolean | null;
  [key: string]: unknown;
};

export async function getSiemConfig(): Promise<SiemConfig | null> {
  try {
    return await apiFetch<SiemConfig>("/api/v1/siem/config");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

// ── GET /api/v1/email-config ────────────────────────────────────────────────
export type EmailConfig = {
  id: string | null;
  use_platform_ses: boolean;
  aws_region: string | null;
  from_email: string | null;
  from_name: string | null;
  is_active: boolean;
  sent_today: number;
  daily_send_limit: number;
};

export function getEmailConfig() {
  return apiFetch<EmailConfig>("/api/v1/email-config");
}
