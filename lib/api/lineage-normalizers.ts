import { getStringFromPaths, getNumberFromPaths, getDateFromPaths, normalizeList } from "@/lib/api/normalizers";
import { severityFrom } from "@/lib/api/compliance-normalizers";
import type { Severity } from "@/lib/api/types";

/* =========================================================================
 * Lineage graph model
 * - Nodes/edges come ONLY from real backend records or a real lineage endpoint.
 * - Edges are created ONLY when a real reference field links two real records.
 * - Relationship strings are static descriptors of those real reference fields.
 * - Nothing is fabricated: no invented sources, pipelines, datasets, or links.
 * ========================================================================= */

export type LineageNodeType =
  | "data_source"
  | "dataset"
  | "pipeline"
  | "schema"
  | "contract"
  | "ai_system"
  | "evidence"
  | "risk"
  | "incident"
  | "report"
  | "integration"
  | "sensitive";

export type LineageNode = {
  id: string;
  type: LineageNodeType;
  label: string;
  status: string | null;
  sourceSystem: string | null;
  owner: string | null;
  lastUpdated: string | null;
  sensitivity: string | null;
  module: string;
  href: string | null;
  linkedIds: string[];
};

export type LineageEdge = {
  id: string;
  from: string;
  to: string;
  relationship: string;
  sourceModule: string;
  confidence: number | null;
};

export type LineageGraph = { nodes: LineageNode[]; edges: LineageEdge[]; derived: boolean };

const LIST = (extra: string[]) => ["", "data", "result", "items", "results", "data.items", ...extra];

function key(type: LineageNodeType, rawId: string): string {
  return `${type}:${rawId}`;
}

/* ------------------------------ Explicit backend graph ------------------------------ */

const TYPE_ALIASES: Record<string, LineageNodeType> = {
  source: "data_source",
  data_source: "data_source",
  datasource: "data_source",
  dataset: "dataset",
  table: "dataset",
  pipeline: "pipeline",
  job: "pipeline",
  flow: "pipeline",
  schema: "schema",
  contract: "contract",
  ai_system: "ai_system",
  aisystem: "ai_system",
  model: "ai_system",
  evidence: "evidence",
  risk: "risk",
  incident: "incident",
  report: "report",
  integration: "integration",
  connector: "integration",
  sensitive: "sensitive",
  pii: "sensitive"
};

function coerceType(raw: string | null): LineageNodeType {
  if (!raw) return "dataset";
  const norm = raw.toLowerCase().replace(/[\s-]+/g, "_");
  return TYPE_ALIASES[norm] ?? "dataset";
}

/** Parse a real lineage graph payload, if the backend provides one. */
export function normalizeLineageGraph(value: unknown): LineageGraph {
  const nodes: LineageNode[] = [];
  const seen = new Set<string>();

  normalizeList(value, LIST(["nodes", "lineage_nodes", "entities", "vertices"])).forEach((entry, index) => {
    const type = coerceType(getStringFromPaths(entry, ["type", "node_type", "kind", "category"]));
    const rawId = getStringFromPaths(entry, ["id", "uuid", "node_id", "key", "name"]) || `node-${index}`;
    const id = key(type, rawId);
    if (seen.has(id)) return;
    seen.add(id);
    nodes.push({
      id,
      type,
      label: getStringFromPaths(entry, ["label", "name", "title", "dataset"]) || rawId,
      status: getStringFromPaths(entry, ["status", "state", "health"]),
      sourceSystem: getStringFromPaths(entry, ["source_system", "system", "source", "connector"]),
      owner: getStringFromPaths(entry, ["owner", "owner_name", "team", "steward"]),
      lastUpdated: getDateFromPaths(entry, ["last_updated", "updated_at", "last_refresh", "modified_at"]),
      sensitivity: getStringFromPaths(entry, ["sensitivity", "classification", "data_classification"]),
      module: "lineage",
      href: null,
      linkedIds: []
    });
  });

  const edges: LineageEdge[] = [];
  normalizeList(value, LIST(["edges", "links", "lineage_edges", "dependencies", "relations"])).forEach((entry, index) => {
    const fromRaw = getStringFromPaths(entry, ["from", "source", "src", "parent", "upstream", "from_id"]);
    const toRaw = getStringFromPaths(entry, ["to", "target", "dst", "child", "downstream", "to_id"]);
    if (!fromRaw || !toRaw) return;
    edges.push({
      id: getStringFromPaths(entry, ["id", "edge_id"]) || `edge-${index}`,
      from: fromRaw,
      to: toRaw,
      relationship: getStringFromPaths(entry, ["relationship", "type", "label", "kind"]) || "depends-on",
      sourceModule: "lineage",
      confidence: getNumberFromPaths(entry, ["confidence", "confidence_score", "score", "weight"])
    });
  });

  return finalize(nodes, edges, false);
}

/* ------------------------------ Derived graph from real records ------------------------------ */

export type LineageRecords = {
  aiSystems?: unknown;
  sources?: unknown;
  pipelines?: unknown;
  evidence?: unknown;
  risks?: unknown;
  incidents?: unknown;
  reports?: unknown;
  integrations?: unknown;
  sensitive?: unknown;
};

type Maps = {
  byId: Record<LineageNodeType, Map<string, string>>;
  byName: Record<LineageNodeType, Map<string, string>>;
};

function emptyMaps(): Maps {
  const types: LineageNodeType[] = [
    "data_source",
    "dataset",
    "pipeline",
    "schema",
    "contract",
    "ai_system",
    "evidence",
    "risk",
    "incident",
    "report",
    "integration",
    "sensitive"
  ];
  const byId = {} as Record<LineageNodeType, Map<string, string>>;
  const byName = {} as Record<LineageNodeType, Map<string, string>>;
  types.forEach((t) => {
    byId[t] = new Map();
    byName[t] = new Map();
  });
  return { byId, byName };
}

/** Resolve a raw reference value to a real node id of the given type, or null if no real match exists. */
function resolveRef(raw: string | null, type: LineageNodeType, maps: Maps): string | null {
  if (!raw) return null;
  const byId = maps.byId[type].get(raw);
  if (byId) return byId;
  const byName = maps.byName[type].get(raw.toLowerCase());
  return byName ?? null;
}

export function deriveLineageGraph(records: LineageRecords): LineageGraph {
  const nodes: LineageNode[] = [];
  const maps = emptyMaps();

  const addNode = (
    type: LineageNodeType,
    rawId: string,
    label: string,
    extra: Partial<LineageNode>,
    name?: string | null
  ) => {
    const id = key(type, rawId);
    if (maps.byId[type].has(rawId)) return id;
    maps.byId[type].set(rawId, id);
    if (name) maps.byName[type].set(name.toLowerCase(), id);
    maps.byName[type].set(label.toLowerCase(), id);
    nodes.push({
      id,
      type,
      label,
      status: null,
      sourceSystem: null,
      owner: null,
      lastUpdated: null,
      sensitivity: null,
      module: type,
      href: null,
      linkedIds: [],
      ...extra
    });
    return id;
  };

  // AI systems
  normalizeList(records.aiSystems, LIST(["systems", "ai_systems"])).forEach((e, i) => {
    const rawId = getStringFromPaths(e, ["id", "uuid", "system_id"]) || `ai-${i}`;
    const name = getStringFromPaths(e, ["name", "system_name", "title"]) || "Unnamed AI system";
    addNode(
      "ai_system",
      rawId,
      name,
      {
        module: "AI Governance",
        href: `/dashboard/ai-systems/${rawId}`,
        status: getStringFromPaths(e, ["status", "lifecycle_stage", "stage", "state"]),
        owner: getStringFromPaths(e, ["owner", "owner_name", "business_owner", "team"]),
        lastUpdated: getDateFromPaths(e, ["updated_at", "last_updated", "modified_at"]),
        sensitivity: getStringFromPaths(e, ["risk_level", "risk_tier", "classification"])
      },
      name
    );
  });

  // Data sources
  normalizeList(records.sources, LIST(["sources", "datasets", "connections"])).forEach((e, i) => {
    const rawId = getStringFromPaths(e, ["id", "uuid", "source_id", "dataset_id"]) || `src-${i}`;
    const name = getStringFromPaths(e, ["name", "source_name", "title", "dataset", "dataset_name"]) || "Unnamed source";
    addNode(
      "data_source",
      rawId,
      name,
      {
        module: "Data Observability",
        href: "/dashboard/data-observability",
        status: getStringFromPaths(e, ["status", "health_status", "state"]),
        sourceSystem: getStringFromPaths(e, ["type", "connector", "engine", "source_type"]),
        owner: getStringFromPaths(e, ["owner", "steward", "team"]),
        lastUpdated: getDateFromPaths(e, ["last_updated", "updated_at", "last_synced"]),
        sensitivity: getStringFromPaths(e, ["classification", "sensitivity"])
      },
      name
    );
  });

  // Pipelines
  normalizeList(records.pipelines, LIST(["pipelines", "jobs", "flows"])).forEach((e, i) => {
    const rawId = getStringFromPaths(e, ["id", "uuid", "pipeline_id", "job_id"]) || `pl-${i}`;
    const name = getStringFromPaths(e, ["name", "pipeline_name", "title", "job"]) || "Unnamed pipeline";
    addNode(
      "pipeline",
      rawId,
      name,
      {
        module: "Data Observability",
        href: "/dashboard/data-observability",
        status: getStringFromPaths(e, ["status", "last_status", "state", "result"]),
        owner: getStringFromPaths(e, ["owner", "team"]),
        lastUpdated: getDateFromPaths(e, ["last_run", "last_run_at", "updated_at"])
      },
      name
    );
  });

  // Integrations
  normalizeList(records.integrations, LIST(["integrations", "connections", "connectors"])).forEach((e, i) => {
    const rawId = getStringFromPaths(e, ["id", "uuid", "integration_id", "slug", "key"]) || `int-${i}`;
    const name = getStringFromPaths(e, ["name", "title", "provider", "type"]) || "Integration";
    addNode(
      "integration",
      rawId,
      name,
      {
        module: "Integrations",
        href: "/dashboard/integrations",
        status: getStringFromPaths(e, ["status", "state", "connection_status"]),
        sourceSystem: getStringFromPaths(e, ["provider", "type", "category"]),
        lastUpdated: getDateFromPaths(e, ["last_synced", "updated_at", "last_sync_at"])
      },
      name
    );
  });

  // Evidence (+ edge -> ai_system)
  const edges: LineageEdge[] = [];
  const addEdge = (from: string | null, to: string | null, relationship: string, sourceModule: string, confidence: number | null = null) => {
    if (!from || !to || from === to) return;
    edges.push({ id: `${from}->${to}:${relationship}`, from, to, relationship, sourceModule, confidence });
  };

  normalizeList(records.evidence, LIST(["evidence"])).forEach((e, i) => {
    const rawId = getStringFromPaths(e, ["id", "uuid", "evidence_id"]) || `ev-${i}`;
    const name = getStringFromPaths(e, ["title", "name", "control", "description"]) || "Evidence";
    const id = addNode("evidence", rawId, name, {
      module: "Evidence",
      href: "/dashboard/evidence",
      status: getStringFromPaths(e, ["status", "freshness", "state"]),
      lastUpdated: getDateFromPaths(e, ["updated_at", "collected_at", "created_at"])
    });
    const sys = resolveRef(getStringFromPaths(e, ["ai_system_id", "system_id", "ai_system", "system", "model_id"]), "ai_system", maps);
    addEdge(id, sys, "evidences", "Evidence");
  });

  // Risks (+ edge -> ai_system)
  normalizeList(records.risks, LIST(["risks"])).forEach((e, i) => {
    const rawId = getStringFromPaths(e, ["id", "uuid", "risk_id"]) || `rk-${i}`;
    const name = getStringFromPaths(e, ["title", "name", "risk", "description"]) || "Risk";
    const id = addNode(
      "risk",
      rawId,
      name,
      {
        module: "Risks",
        href: "/dashboard/risks",
        status: getStringFromPaths(e, ["status", "state"]),
        sensitivity: getStringFromPaths(e, ["severity", "risk_level", "priority"]),
        lastUpdated: getDateFromPaths(e, ["updated_at", "created_at"])
      },
      name
    );
    const sys = resolveRef(getStringFromPaths(e, ["ai_system_id", "system_id", "ai_system", "system", "model_id"]), "ai_system", maps);
    addEdge(id, sys, "risk-of", "Risks");
  });

  // Incidents (+ edge -> ai_system, -> risk)
  normalizeList(records.incidents, LIST(["incidents"])).forEach((e, i) => {
    const rawId = getStringFromPaths(e, ["id", "uuid", "incident_id"]) || `inc-${i}`;
    const name = getStringFromPaths(e, ["title", "name", "summary", "description"]) || "Incident";
    const id = addNode(
      "incident",
      rawId,
      name,
      {
        module: "Incidents",
        href: "/dashboard/incidents",
        status: getStringFromPaths(e, ["status", "state"]),
        sensitivity: getStringFromPaths(e, ["severity", "priority", "impact"]),
        lastUpdated: getDateFromPaths(e, ["updated_at", "created_at", "reported_at"])
      },
      name
    );
    addEdge(id, resolveRef(getStringFromPaths(e, ["ai_system_id", "system_id", "ai_system", "model_id"]), "ai_system", maps), "impacts", "Incidents");
    addEdge(id, resolveRef(getStringFromPaths(e, ["risk_id", "related_risk_id"]), "risk", maps), "linked-risk", "Incidents");
  });

  // Reports (+ edge -> ai_system)
  normalizeList(records.reports, LIST(["reports"])).forEach((e, i) => {
    const rawId = getStringFromPaths(e, ["id", "uuid", "report_id"]) || `rp-${i}`;
    const name = getStringFromPaths(e, ["title", "name", "type", "framework"]) || "Report";
    const id = addNode("report", rawId, name, {
      module: "Reports",
      href: "/dashboard/reports",
      status: getStringFromPaths(e, ["status", "state"]),
      lastUpdated: getDateFromPaths(e, ["updated_at", "generated_at", "created_at"])
    });
    addEdge(id, resolveRef(getStringFromPaths(e, ["ai_system_id", "system_id"]), "ai_system", maps), "reports-on", "Reports");
  });

  // Pipeline -> source/target edges (resolved against real source nodes only)
  normalizeList(records.pipelines, LIST(["pipelines", "jobs", "flows"])).forEach((e, i) => {
    const rawId = getStringFromPaths(e, ["id", "uuid", "pipeline_id", "job_id"]) || `pl-${i}`;
    const id = key("pipeline", rawId);
    const input = resolveRef(getStringFromPaths(e, ["source", "source_id", "input", "input_dataset", "dataset", "upstream"]), "data_source", maps);
    const output = resolveRef(getStringFromPaths(e, ["target", "target_id", "output", "output_dataset", "downstream"]), "data_source", maps);
    addEdge(input, id, "feeds", "Data Observability");
    addEdge(id, output, "writes", "Data Observability");
  });

  // Sensitive-data signals as metadata nodes (no raw PII), edge -> data_source when referenced
  normalizeList(records.sensitive, LIST(["findings", "sensitive_data", "signals", "items", "results"])).forEach((e, i) => {
    const rawId = getStringFromPaths(e, ["id", "uuid", "finding_id"]) || `sd-${i}`;
    const category = getStringFromPaths(e, ["category", "type", "classification", "data_type", "pii_type"]) || "Sensitive data";
    const id = addNode("sensitive", rawId, category, {
      module: "Data Observability",
      href: "/dashboard/data-observability",
      status: getStringFromPaths(e, ["status", "state"]),
      sensitivity: getStringFromPaths(e, ["severity", "risk_level", "sensitivity"]),
      sourceSystem: getStringFromPaths(e, ["system", "source", "dataset"])
    });
    const src = resolveRef(getStringFromPaths(e, ["source", "source_id", "dataset", "dataset_id", "system", "table"]), "data_source", maps);
    addEdge(id, src, "contains-sensitive", "Data Observability");
  });

  return finalize(nodes, edges, true);
}

/* ------------------------------ Shared finalize + helpers ------------------------------ */

function finalize(nodes: LineageNode[], edges: LineageEdge[], derived: boolean): LineageGraph {
  // De-dupe edges and drop self-links; keep all (broken links surfaced separately as a KPI).
  const seen = new Set<string>();
  const deduped = edges.filter((e) => {
    if (e.from === e.to) return false;
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });

  const byId = new Map(nodes.map((n) => [n.id, n]));
  deduped.forEach((e) => {
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    if (a && !a.linkedIds.includes(e.to)) a.linkedIds.push(e.to);
    if (b && !b.linkedIds.includes(e.from)) b.linkedIds.push(e.from);
  });

  return { nodes, edges: deduped, derived };
}

export function countBrokenLinks(graph: LineageGraph): number {
  const ids = new Set(graph.nodes.map((n) => n.id));
  return graph.edges.filter((e) => !ids.has(e.from) || !ids.has(e.to)).length;
}

export function nodeLabel(graph: LineageGraph, id: string): string {
  return graph.nodes.find((n) => n.id === id)?.label ?? id;
}

/* ------------------------------ Lineage table rows ------------------------------ */

export type LineageTableRow = {
  id: string;
  source: string;
  relationship: string;
  target: string;
  sourceModule: string;
  confidence: number | null;
};

export function lineageTableRows(graph: LineageGraph): LineageTableRow[] {
  return graph.edges.map((e) => ({
    id: e.id,
    source: nodeLabel(graph, e.from),
    relationship: e.relationship,
    target: nodeLabel(graph, e.to),
    sourceModule: e.sourceModule,
    confidence: e.confidence
  }));
}

/* ------------------------------ Sensitive data / quality (metadata only) ------------------------------ */

export type SensitiveFinding = {
  id: string;
  category: string;
  system: string | null;
  severity: Severity | null;
  count: number | null;
  status: string | null;
};

/** Metadata only — never reads value/sample/example fields, so no raw PII is surfaced. */
export function normalizeSensitiveFindings(value: unknown): SensitiveFinding[] {
  return normalizeList(value, LIST(["findings", "sensitive_data", "signals", "items", "results"])).map((e, i) => {
    const sevRaw = getStringFromPaths(e, ["severity", "risk_level", "priority", "level"]);
    return {
      id: getStringFromPaths(e, ["id", "uuid", "finding_id"]) || `finding-${i}`,
      category: getStringFromPaths(e, ["category", "type", "classification", "data_type", "pii_type"]) || "Sensitive data",
      system: getStringFromPaths(e, ["system", "source", "source_name", "dataset", "table"]),
      severity: sevRaw ? severityFrom(sevRaw) : null,
      count: getNumberFromPaths(e, ["count", "occurrences", "matches", "records", "total"]),
      status: getStringFromPaths(e, ["status", "state", "remediation_status"])
    };
  });
}

export type QualityIssue = {
  id: string;
  title: string;
  system: string | null;
  severity: Severity | null;
  status: string | null;
};

export function normalizeQualityIssues(value: unknown): QualityIssue[] {
  return normalizeList(value, LIST(["issues", "quality_issues", "checks", "items", "results"])).map((e, i) => {
    const sevRaw = getStringFromPaths(e, ["severity", "risk_level", "priority", "level"]);
    return {
      id: getStringFromPaths(e, ["id", "uuid", "issue_id"]) || `issue-${i}`,
      title: getStringFromPaths(e, ["title", "name", "rule", "check", "message", "description"]) || "Quality issue",
      system: getStringFromPaths(e, ["system", "source", "source_name", "dataset", "table"]),
      severity: sevRaw ? severityFrom(sevRaw) : null,
      status: getStringFromPaths(e, ["status", "state"])
    };
  });
}
