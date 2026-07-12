import { apiFetch } from "@/lib/api/client";

/**
 * Data Observability API — typed against the live backend schema
 * (/api/v1/data-observability/*: assets, quality, access, retention,
 * residency, incidents, lineage, dashboard).
 */

// ── GET /api/v1/data-observability/dashboard ─────────────────────────────────
export type DataObsDashboard = {
  asset_coverage: {
    total_assets: number;
    classified_count: number;
    confirmed_count: number;
    classification_coverage_pct: number;
    by_sensitivity_tier: Record<string, number>;
    needs_review_count: number;
  };
  quality_metrics: {
    readings_last_7d: number;
    breach_count_7d: number;
    pass_count_7d: number;
    breach_rate_7d: number;
  };
  access_anomalies: {
    anomaly_count_7d: number;
    active_incidents: number;
    by_severity: Record<string, number>;
  };
  retention: {
    assets_with_policy: number;
    pending_reviews: number;
    retention_compliance_rate: number;
  };
  data_obligation_coverage: {
    total_assets: number;
    linked_assets: number;
    unlinked_assets: number;
    coverage_pct: number;
    by_link_type: Record<string, number>;
    by_framework: Record<string, number>;
  };
  /** backend-generated plain-language findings */
  insights: string[];
  generated_at: string;
};

export function getDataObsDashboard() {
  return apiFetch<DataObsDashboard>("/api/v1/data-observability/dashboard");
}

// ── GET /api/v1/data-observability/assets (DataAssetRead[]) ─────────────────
export type DataAsset = {
  id: string;
  organization_id: string;
  name: string;
  asset_type: string;
  description: string | null;
  owner_id: string;
  custodian_id: string | null;
  sensitivity_tier: string | null;
  classification_type: string | null;
  classification_confidence: string | null;
  classification_source: string | null;
  classification_confirmed: boolean;
  geographic_locations: string[];
  permitted_regions: string[];
  schema_column_names: string[] | null;
  retention_policy_days: number | null;
  retention_review_date: string | null;
  data_volume_estimate: string | null;
  source_system: string | null;
  tags: string[] | null;
  is_phi: boolean;
  hipaa_safeguard_required: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  classification_age_days: number | null;
  classification_stale: boolean;
  recommended_review: boolean;
  context_flags: string[];
};

export function getDataAssets(limit = 100) {
  return apiFetch<DataAsset[]>(`/api/v1/data-observability/assets?limit=${limit}`);
}

// ── GET /api/v1/data-observability/assets/summary ────────────────────────────
export type DataAssetSummary = {
  total_assets: number;
  by_asset_type: Record<string, number>;
  by_sensitivity_tier: Record<string, number>;
  by_classification_type: Record<string, number>;
  confirmed_count: number;
  unconfirmed_count: number;
  needs_review_count: number;
  stale_classification_count: number;
  high_risk_unconfirmed_count: number;
};

export function getDataAssetSummary() {
  return apiFetch<DataAssetSummary>("/api/v1/data-observability/assets/summary");
}

// ── POST /api/v1/data-observability/assets ───────────────────────────────────
// Allowed values enforced by the backend service layer (422 on mismatch).
export const ASSET_TYPES = ["database", "table", "schema", "file_store", "bucket", "data_lake", "data_stream", "api", "other"] as const;
export const SENSITIVITY_TIERS = ["public", "internal", "confidential", "restricted", "secret"] as const;
export const CLASSIFICATION_TYPES = [
  "personal_data",
  "sensitive_personal_data",
  "financial_data",
  "health_data",
  "intellectual_property",
  "operational_data",
  "public_data",
  "unclassified"
] as const;

export type DataAssetCreate = {
  name: string;
  asset_type: string;
  owner_id: string;
  description?: string | null;
  sensitivity_tier?: string | null;
  classification_type?: string | null;
  geographic_locations?: string[];
  source_system?: string | null;
  is_phi?: boolean;
};

export function createDataAsset(body: DataAssetCreate) {
  return apiFetch<DataAsset>("/api/v1/data-observability/assets", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

// ── GET /api/v1/data-observability/quality/dashboard ─────────────────────────
export type QualityDashboard = {
  total_configs: number;
  active_configs: number;
  recent_breaches_7d: number;
  stale_config_count: number;
  high_risk_breach_count_7d: number;
  by_metric_type: Record<string, { configs: number; breach_rate: number }>;
  assets_with_breaches: { asset_id: string; asset_name: string; breach_count: number }[];
  context_flags: string[];
};

export function getQualityDashboard() {
  return apiFetch<QualityDashboard>("/api/v1/data-observability/quality/dashboard");
}

// ── GET /api/v1/data-observability/retention/summary ─────────────────────────
export type RetentionSummary = {
  total_assets_with_policy: number;
  expired_count: number;
  pending_reviews: number;
  by_required_action: Record<string, number>;
  compliance_rate: number;
};

export function getRetentionSummary() {
  return apiFetch<RetentionSummary>("/api/v1/data-observability/retention/summary");
}

// ── GET /api/v1/data-observability/residency/summary ─────────────────────────
export type ResidencySummary = {
  total_assets_checked: number;
  compliant_count: number;
  violation_count: number;
  open_violations: number;
  by_violation_type: Record<string, number>;
  assets_with_open_violations: Record<string, unknown>[];
  eea_compliant_pct: number;
};

export function getResidencySummary() {
  return apiFetch<ResidencySummary>("/api/v1/data-observability/residency/summary");
}

// ── GET /api/v1/data-observability/incidents/summary ─────────────────────────
export type DataIncidentSummary = {
  total: number;
  by_severity: Record<string, number>;
  by_status: Record<string, number>;
  by_detector_type: Record<string, number>;
  new_count: number;
  auto_escalated_count: number;
  assets_with_active_incidents: number;
  open_count: number;
  critical_open_count: number;
  stale_new_count: number;
  mean_time_to_resolve_hours: number;
  context_flags: string[];
};

export function getDataIncidentSummary() {
  return apiFetch<DataIncidentSummary>("/api/v1/data-observability/incidents/summary");
}

// ── /api/v1/data-observability/incidents (DataIncidentRead[] + lifecycle) ───
// Router: app/data_observability/routers/incidents.py — status is server-managed,
// terminal states (resolved/dismissed) reject further transitions with 422.
export const DATA_INCIDENT_SEVERITIES = ["critical", "high", "medium", "low"] as const;
export const DATA_INCIDENT_DETECTOR_TYPES = [
  "manual",
  "anomaly_rule",
  "quality_breach",
  "retention_violation",
  "residency_violation"
] as const;
export const DATA_INCIDENT_TERMINAL_STATUSES = new Set(["resolved", "dismissed"]);

export type IncidentStatusNote = {
  status: string;
  note: string | null;
  user_id: string | null;
  at: string;
};

export type DataIncident = {
  id: string;
  organization_id: string;
  data_asset_id: string;
  detector_type: string;
  detector_ref_id: string | null;
  title: string;
  description: string;
  severity: string;
  status: string;
  rule_type: string | null;
  evidence_json: Record<string, unknown>;
  linked_issue_id: string | null;
  detected_by: string;
  detected_at: string;
  resolved_by: string | null;
  resolved_at: string | null;
  status_notes_json: IncidentStatusNote[];
  created_at: string;
  updated_at: string;
  age_hours: number;
  recurrence_count: number;
  escalated_to_issue: boolean;
  context_flags: string[];
};

export type DataIncidentCreate = {
  data_asset_id: string;
  title: string;
  description: string;
  severity: string;
  detector_type?: string;
  detector_ref_id?: string | null;
  rule_type?: string | null;
  evidence_json?: Record<string, unknown>;
  detected_by?: string;
};

export function getDataIncidents(params: { status?: string; severity?: string; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.severity) qs.set("severity", params.severity);
  qs.set("limit", String(params.limit ?? 100));
  return apiFetch<DataIncident[]>(`/api/v1/data-observability/incidents?${qs.toString()}`);
}

export function createDataIncident(body: DataIncidentCreate) {
  return apiFetch<DataIncident>("/api/v1/data-observability/incidents", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function investigateIncident(incidentId: string, notes?: string | null) {
  return apiFetch<DataIncident>(`/api/v1/data-observability/incidents/${incidentId}/investigate`, {
    method: "POST",
    body: JSON.stringify({ notes: notes ?? null })
  });
}

export function containIncident(incidentId: string, notes?: string | null) {
  return apiFetch<DataIncident>(`/api/v1/data-observability/incidents/${incidentId}/contain`, {
    method: "POST",
    body: JSON.stringify({ notes: notes ?? null })
  });
}

export function resolveIncident(incidentId: string, notes?: string | null) {
  return apiFetch<DataIncident>(`/api/v1/data-observability/incidents/${incidentId}/resolve`, {
    method: "POST",
    body: JSON.stringify({ notes: notes ?? null })
  });
}

export function dismissIncident(incidentId: string, notes?: string | null) {
  return apiFetch<DataIncident>(`/api/v1/data-observability/incidents/${incidentId}/dismiss`, {
    method: "POST",
    body: JSON.stringify({ notes: notes ?? null })
  });
}

export type EscalateIncidentResult = { issue_id: string; incident_id: string };

export function escalateIncidentToIssue(incidentId: string) {
  return apiFetch<EscalateIncidentResult>(`/api/v1/data-observability/incidents/${incidentId}/escalate-to-issue`, {
    method: "POST"
  });
}

// ── GET /api/v1/data-observability/access/summary ────────────────────────────
export type DataAccessSummary = {
  window_days: number;
  total_accesses_7d: number;
  by_access_type: Record<string, number>;
  by_access_result: Record<string, number>;
  unique_actors: number;
  anomalies_detected: number;
  failed_access_rate: number;
  anomalous_access_rate: number;
  after_hours_accesses: number;
  cross_border_accesses: number;
  context_flags: string[];
};

export function getDataAccessSummary() {
  return apiFetch<DataAccessSummary>("/api/v1/data-observability/access/summary");
}

// ── GET /api/v1/data-observability/lineage/nodes (LineageNodeRead[]) ─────────
export type LineageNode = {
  id: string;
  organization_id: string;
  node_type: string;
  data_asset_id: string | null;
  name: string;
  description: string | null;
  system_name: string | null;
  created_at: string;
  updated_at: string;
  upstream_edge_count: number;
  downstream_edge_count: number;
  is_orphan: boolean;
  context_flags: string[];
};

export function getLineageNodes() {
  return apiFetch<LineageNode[]>("/api/v1/data-observability/lineage/nodes");
}

// ── GET /api/v1/data-observability/lineage/assets/{asset_id}/lineage ─────────
export type LineageGraphNode = {
  id: string;
  name: string;
  node_type: string;
};

export type LineageGraphEdge = {
  upstream_id: string;
  downstream_id: string;
  source_method: string;
};

export type LineageGraph = {
  asset_id: string;
  nodes: LineageGraphNode[];
  edges: LineageGraphEdge[];
  node_count: number;
  edge_count: number;
  isolated_node_count: number;
  cycle_detected: boolean;
  stale_edge_count: number;
  context_flags: string[];
};

export function getAssetLineage(assetId: string) {
  return apiFetch<LineageGraph>(`/api/v1/data-observability/lineage/assets/${assetId}/lineage`);
}
