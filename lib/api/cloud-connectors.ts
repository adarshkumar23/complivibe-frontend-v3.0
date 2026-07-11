import { apiFetch } from "@/lib/api/client";

/**
 * Cloud connectors API — typed against the live backend schema
 * (/api/v1/cloud-connectors*). Providers: aws | azure | gcp | github | okta.
 *
 * NOTE: connector creation encrypts its webhook signing secret via the
 * OpenBao/Vault transit engine — the backend requires VAULT_ADDR to be set.
 */

export const CONNECTOR_TYPES = ["aws", "azure", "gcp", "github", "okta"] as const;
export type ConnectorType = (typeof CONNECTOR_TYPES)[number];

// ── GET /api/v1/cloud-connectors ────────────────────────────────────────────
export type CloudConnector = {
  id: string;
  connector_type: ConnectorType;
  display_name: string;
  status: string;
  auto_apply_deterministic_mappings: boolean | null;
  expected_event_interval_hours: number | null;
  last_event_received_at: string | null;
  consecutive_error_count: number | null;
  last_error_message: string | null;
  is_active: boolean;
  created_at: string;
};

export function getCloudConnectors() {
  return apiFetch<CloudConnector[]>("/api/v1/cloud-connectors");
}

export function createCloudConnector(body: {
  connector_type: ConnectorType;
  display_name: string;
  provider_config_json?: Record<string, unknown>;
}) {
  return apiFetch<CloudConnector>("/api/v1/cloud-connectors", {
    method: "POST",
    body: JSON.stringify({ provider_config_json: {}, ...body })
  });
}

// ── GET /api/v1/cloud-connectors/{id}/setup ─────────────────────────────────
export type ConnectorSetup = {
  connector_type: string;
  webhook_url: string;
  signing_secret: string;
  provider_setup_steps: Record<string, unknown>[];
};

export function getConnectorSetup(connectorId: string) {
  return apiFetch<ConnectorSetup>(`/api/v1/cloud-connectors/${connectorId}/setup`);
}

// ── GET /api/v1/cloud-connectors/{id}/health ────────────────────────────────
export type ConnectorHealth = {
  expected_event_interval_hours: number | null;
  hours_since_last_event: number | null;
  is_stale: boolean;
  context_flags: string[] | null;
};

export function getConnectorHealth(connectorId: string) {
  return apiFetch<ConnectorHealth>(`/api/v1/cloud-connectors/${connectorId}/health`);
}

// ── Mapping rules (finding category → control) ──────────────────────────────
export type MappingRule = {
  id: string;
  finding_category: string;
  target_control_id: string | null;
  target_control_common_tag: string | null;
  confidence: string | null;
  is_active: boolean;
  created_at: string;
};

export function getMappingRules() {
  return apiFetch<MappingRule[]>("/api/v1/cloud-connectors/mapping-rules");
}

export function createMappingRule(body: {
  finding_category: string;
  target_control_id?: string;
  target_control_common_tag?: string;
  confidence?: string;
}) {
  return apiFetch<MappingRule>("/api/v1/cloud-connectors/mapping-rules", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function deleteMappingRule(ruleId: string) {
  return apiFetch<unknown>(`/api/v1/cloud-connectors/mapping-rules/${ruleId}`, { method: "DELETE" });
}
