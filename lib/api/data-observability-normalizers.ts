import {
  getStringFromPaths,
  getNumberFromPaths,
  getDateFromPaths,
  normalizeList
} from "@/lib/api/normalizers";
import { severityFrom } from "@/lib/api/compliance-normalizers";
import type { Severity } from "@/lib/api/types";

const LIST = (extra: string[]) => ["", "data", "result", "items", "results", "data.items", ...extra];

/* ----------------------------- Sources ----------------------------- */
export type NormalizedSource = {
  id: string;
  name: string;
  type: string | null;
  status: string | null;
  health: number | null;
  freshnessDate: string | null;
  freshnessLabel: string | null;
  owner: string | null;
};

export function normalizeSources(value: unknown): NormalizedSource[] {
  return normalizeList(value, LIST(["sources", "datasets", "connections"])).map((entry, index) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "source_id", "dataset_id"]) || `source-${index}`,
    name: getStringFromPaths(entry, ["name", "source_name", "title", "dataset", "dataset_name"]) || "Unnamed source",
    type: getStringFromPaths(entry, ["type", "source_type", "kind", "connector", "category", "engine"]),
    status: getStringFromPaths(entry, ["status", "health_status", "state", "health"]),
    health: getNumberFromPaths(entry, ["health_score", "health", "score", "quality_score", "reliability"]),
    freshnessDate: getDateFromPaths(entry, ["last_updated", "updated_at", "last_refresh", "last_synced", "freshness_at"]),
    freshnessLabel: getStringFromPaths(entry, ["freshness", "freshness_status", "freshness_label"]),
    owner: getStringFromPaths(entry, ["owner", "owner_name", "team", "steward", "responsible"])
  }));
}

/* ----------------------------- Pipelines ----------------------------- */
export type NormalizedPipeline = {
  id: string;
  name: string;
  status: string | null;
  reliability: number | null;
  lastRun: string | null;
  owner: string | null;
};

export function normalizePipelines(value: unknown): NormalizedPipeline[] {
  return normalizeList(value, LIST(["pipelines", "jobs", "flows"])).map((entry, index) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "pipeline_id", "job_id"]) || `pipeline-${index}`,
    name: getStringFromPaths(entry, ["name", "pipeline_name", "title", "job"]) || "Unnamed pipeline",
    status: getStringFromPaths(entry, ["status", "last_status", "state", "result"]),
    reliability: getNumberFromPaths(entry, ["reliability", "success_rate", "uptime", "score", "health"]),
    lastRun: getDateFromPaths(entry, ["last_run", "last_run_at", "updated_at", "ran_at", "finished_at"]),
    owner: getStringFromPaths(entry, ["owner", "owner_name", "team"])
  }));
}

export function isFailed(status: string | null): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return ["fail", "error", "broken", "down", "critical", "unhealthy"].some((x) => s.includes(x));
}

export function isStale(source: NormalizedSource): boolean {
  const label = (source.freshnessLabel || source.status || "").toLowerCase();
  return ["stale", "expired", "overdue", "delayed"].some((x) => label.includes(x));
}

/* ----------------------------- Quality metrics ----------------------------- */
export type QualityMetric = { label: string; value: number | null };

const QUALITY_FIELDS: { label: string; paths: string[] }[] = [
  { label: "Completeness", paths: ["completeness", "completeness_score", "complete", "completeness_pct"] },
  { label: "Accuracy", paths: ["accuracy", "accuracy_score", "accuracy_pct"] },
  { label: "Consistency", paths: ["consistency", "consistency_score", "consistency_pct"] },
  { label: "Freshness", paths: ["freshness_score", "freshness", "freshness_coverage", "freshness_pct"] },
  { label: "Schema stability", paths: ["schema_stability", "schema_stability_score", "stability", "schema_score"] }
];

export function qualityMetrics(...sources: unknown[]): QualityMetric[] {
  return QUALITY_FIELDS.map(({ label, paths }) => {
    let value: number | null = null;
    for (const src of sources) {
      if (src == null) continue;
      value = getNumberFromPaths(src, paths);
      if (value !== null) break;
    }
    return { label, value };
  });
}

/* ----------------------------- Schema & change ----------------------------- */
export type SchemaChange = { id: string; title: string; type: string | null; timestamp: string | null };
export type SchemaSummary = {
  fieldsAdded: number | null;
  fieldsRemoved: number | null;
  contractViolations: number | null;
  changes: SchemaChange[];
};

export function schemaSummary(...sources: unknown[]): SchemaSummary {
  const pick = (paths: string[]) => {
    for (const src of sources) {
      if (src == null) continue;
      const v = getNumberFromPaths(src, paths);
      if (v !== null) return v;
    }
    return null;
  };
  const changes: SchemaChange[] = [];
  for (const src of sources) {
    changes.push(
      ...normalizeList(src, ["schema_changes", "changes", "recent_changes", "change_log"]).map((entry, index) => ({
        id: getStringFromPaths(entry, ["id", "uuid", "change_id"]) || `change-${index}`,
        title: getStringFromPaths(entry, ["title", "field", "name", "change", "description", "summary"]) || "Schema change",
        type: getStringFromPaths(entry, ["type", "change_type", "category", "operation"]),
        timestamp: getDateFromPaths(entry, ["timestamp", "created_at", "updated_at", "detected_at", "date"])
      }))
    );
  }
  return {
    fieldsAdded: pick(["fields_added", "added_fields", "added", "columns_added"]),
    fieldsRemoved: pick(["fields_removed", "removed_fields", "removed", "columns_removed"]),
    contractViolations: pick(["contract_violations", "violations", "schema_violations", "breaking_changes"]),
    changes
  };
}

/* ----------------------------- Priority actions ----------------------------- */
export type DataAction = { id: string; title: string; description: string | null; severity: Severity };

export function dataPriorityActions(
  overview: unknown,
  pipelines: NormalizedPipeline[],
  sources: NormalizedSource[],
  sensitive: SensitiveSignals
): DataAction[] {
  // 1) explicit actions/issues/alerts from the backend
  const explicit = normalizeList(overview, ["actions", "issues", "priority_actions", "alerts", "incidents"]).map(
    (entry, index) => ({
      id: getStringFromPaths(entry, ["id", "uuid", "action_id", "alert_id"]) || `action-${index}`,
      title: getStringFromPaths(entry, ["title", "name", "message", "summary", "description"]) || "Data issue",
      description: getStringFromPaths(entry, ["description", "details", "recommendation", "reason"]),
      severity: severityFrom(getStringFromPaths(entry, ["severity", "priority", "risk_level", "level"]))
    })
  );
  if (explicit.length > 0) return explicit;

  // 2) derive from real signals — never invents names
  const derived: DataAction[] = [];
  pipelines
    .filter((p) => isFailed(p.status))
    .forEach((p) => derived.push({ id: `pf-${p.id}`, title: `Failed pipeline: ${p.name}`, description: p.status, severity: "high" }));
  sources
    .filter(isStale)
    .forEach((s) => derived.push({ id: `st-${s.id}`, title: `Stale dataset: ${s.name}`, description: s.freshnessLabel, severity: "medium" }));
  if (sensitive.retention != null && sensitive.retention > 0) {
    derived.push({
      id: "retention",
      title: `Retention violations: ${sensitive.retention}`,
      description: "Sensitive data retention policy breached",
      severity: "high"
    });
  }
  if (sensitive.accessAnomalies != null && sensitive.accessAnomalies > 0) {
    derived.push({
      id: "access",
      title: `Access anomalies: ${sensitive.accessAnomalies}`,
      description: "Unusual access patterns detected",
      severity: "medium"
    });
  }
  return derived;
}

/* ----------------------------- Lineage ----------------------------- */
export type LineageNode = { id: string; label: string };
export type LineageEdge = { from: string; to: string };
export type Lineage = { nodes: LineageNode[]; edges: LineageEdge[] };

export function normalizeLineage(...sources: unknown[]): Lineage {
  const nodes: LineageNode[] = [];
  const edges: LineageEdge[] = [];
  for (const src of sources) {
    normalizeList(src, ["nodes", "lineage_nodes", "entities", "datasets"]).forEach((entry, index) => {
      const id = getStringFromPaths(entry, ["id", "uuid", "node_id", "name"]) || `node-${index}`;
      nodes.push({ id, label: getStringFromPaths(entry, ["label", "name", "title", "dataset"]) || id });
    });
    normalizeList(src, ["edges", "links", "lineage_edges", "dependencies", "relations"]).forEach((entry) => {
      const from = getStringFromPaths(entry, ["from", "source", "src", "parent", "upstream"]);
      const to = getStringFromPaths(entry, ["to", "target", "dst", "child", "downstream"]);
      if (from && to) edges.push({ from, to });
    });
  }
  return { nodes, edges };
}

/* ----------------------------- Sensitive signals ----------------------------- */
export type SensitiveSignals = {
  pii: number | null;
  exposure: number | null;
  accessAnomalies: number | null;
  retention: number | null;
};

export function sensitiveSignals(value: unknown): SensitiveSignals {
  const pick = (paths: string[]) => getNumberFromPaths(value, paths);
  return {
    pii: pick(["pii_findings", "pii_count", "pii", "findings_count", "sensitive_findings"]),
    exposure: pick(["exposure_risks", "exposed", "exposure_count", "exposures"]),
    accessAnomalies: pick(["access_anomalies", "anomalies", "access_anomaly_count"]),
    retention: pick(["retention_violations", "retention", "retention_count"])
  };
}

/* ----------------------------- Data events ----------------------------- */
export type DataEvent = { id: string; title: string; type: string | null; timestamp: string | null; source: string | null };

export function normalizeDataEvents(...sources: unknown[]): DataEvent[] {
  const events: DataEvent[] = [];
  for (const src of sources) {
    events.push(
      ...normalizeList(src, ["events", "recent_events", "activity", "alerts", "log"]).map((entry, index) => ({
        id: getStringFromPaths(entry, ["id", "uuid", "event_id"]) || `event-${index}`,
        title: getStringFromPaths(entry, ["title", "name", "message", "summary", "description"]) || "Data event",
        type: getStringFromPaths(entry, ["type", "event_type", "status", "category", "severity"]),
        timestamp: getDateFromPaths(entry, ["timestamp", "created_at", "updated_at", "event_time", "date"]),
        source: getStringFromPaths(entry, ["source", "source_name", "dataset", "pipeline"])
      }))
    );
  }
  return events;
}

/* ----------------------------- KPI helpers ----------------------------- */
export function averageReliability(pipelines: NormalizedPipeline[]): number | null {
  const scored = pipelines.filter((p) => p.reliability != null);
  if (scored.length === 0) return null;
  return Math.round(scored.reduce((sum, p) => sum + (p.reliability as number), 0) / scored.length);
}
