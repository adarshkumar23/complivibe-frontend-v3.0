import { apiFetch } from "@/lib/api/client";

/**
 * Trust Graph domain API — typed against the live backend schema.
 *
 * Three distinct real endpoints, no synthetic aggregation layer:
 *  - GET /api/v1/risks/{risk_id}/graph            → per-risk entity coverage graph
 *      (control / vendor / obligation / evidence / policy nodes around one risk)
 *  - GET /api/v1/risks/{risk_id}/dependency-graph  → risk-to-risk cascade graph
 *      (separate RiskDependency model: cascades_to / triggers / compounds)
 *  - GET /api/v1/vendors/{vendor_id}/supply-chain-graph → vendor sub-processor chain
 *
 * Controls have no graph endpoint of their own (confirmed by backend recon) — the
 * entity picker below only offers risk and vendor as root entities.
 */

// ── GET /api/v1/risks/{risk_id}/graph?depth= ────────────────────────────────
export type GraphNodeType = "control" | "vendor" | "obligation" | "evidence" | "policy";
export type GraphNodeHealth = "healthy" | "degraded" | "critical" | "unknown";

export type RiskGraphNode = {
  node_id: string;
  node_type: GraphNodeType;
  label: string;
  status: string | null;
  health: GraphNodeHealth;
  metadata: Record<string, unknown>;
};

export type RiskGraphEdge = {
  source_id: string;
  target_id: string;
  relationship:
    | "mitigated_by"
    | "affects"
    | "governed_by"
    | "evidenced_by"
    | "has_evidence"
    | "policy_linked"
    | "vendor_risk_factor"
    | string;
};

export type RiskEntityGraph = {
  risk: { id: string; name: string; status: string; score: number | null; category: string | null };
  nodes: RiskGraphNode[];
  edges: RiskGraphEdge[];
  summary: {
    total_nodes: number;
    by_type: Partial<Record<GraphNodeType, number>>;
    by_health: Partial<Record<GraphNodeHealth, number>>;
    depth_reached: number;
  };
};

export function getRiskEntityGraph(riskId: string, depth: 1 | 2 = 2) {
  return apiFetch<RiskEntityGraph>(`/api/v1/risks/${riskId}/graph?depth=${depth}`);
}

// ── GET /api/v1/risks/{risk_id}/dependency-graph ────────────────────────────
export type RiskDependencyNode = {
  risk_id: string;
  title: string;
  status: string;
  severity: string | null;
  category: string | null;
  inherent_score: number | null;
  residual_score: number | null;
};

export type RiskDependencyEdge = {
  id: string;
  upstream_risk_id: string;
  downstream_risk_id: string;
  relationship_type: "cascades_to" | "triggers" | "compounds" | string;
};

export type RiskDependencyGraph = {
  root_risk_id: string;
  nodes: RiskDependencyNode[];
  edges: RiskDependencyEdge[];
  summary: { total_nodes: number; total_edges: number };
};

export function getRiskDependencyGraph(riskId: string) {
  return apiFetch<RiskDependencyGraph>(`/api/v1/risks/${riskId}/dependency-graph`);
}

// ── GET /api/v1/vendors/{vendor_id}/supply-chain-graph ──────────────────────
export type VendorChainNode = {
  id: string;
  name: string;
  vendor_type: string | null;
  risk_tier: string | null;
  status: string;
};

export type VendorChainEdge = {
  source_id?: string;
  target_id?: string;
  [key: string]: unknown;
};

export type VendorSupplyChainGraph = {
  root_vendor_id: string;
  depth: number;
  nodes: VendorChainNode[];
  edges: VendorChainEdge[];
  data_quality_findings: unknown[];
  open_alerts: unknown[];
  risk_summary: {
    node_count: number;
    edge_count: number;
    cycle_count: number;
    open_alert_count: number;
    open_alerts_by_severity: Record<string, number>;
    stale_alert_count: number;
    archived_vendors_in_chain: number;
    highest_open_alert_severity: string | null;
    truncated: boolean;
  };
};

export function getVendorSupplyChainGraph(vendorId: string) {
  return apiFetch<VendorSupplyChainGraph>(`/api/v1/vendors/${vendorId}/supply-chain-graph`);
}
