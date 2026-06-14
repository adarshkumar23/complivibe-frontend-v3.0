import { normalizeAiSystems } from "@/lib/api/ai-system-normalizers";
import { normalizeEvidenceItems } from "@/lib/api/evidence-normalizers";
import { normalizeRisks } from "@/lib/api/risk-normalizers";
import { normalizeIncidents } from "@/lib/api/incident-normalizers";
import { normalizeReports } from "@/lib/api/report-normalizers";
import { normalizeAuditPacks } from "@/lib/api/audit-pack-normalizers";
import { normalizeQuestionnaires } from "@/lib/api/questionnaire-normalizers";
import { normalizeTrustAssets } from "@/lib/api/trust-center-normalizers";
import { normalizePolicies } from "@/lib/api/policy-normalizers";
import { normalizeVendors } from "@/lib/api/vendor-risk-normalizers";
import { normalizeRegulatoryDeadlines } from "@/lib/api/regulatory-normalizers";
import { normalizeCertifications } from "@/lib/api/certification-normalizers";
import { normalizeApprovals } from "@/lib/api/approval-normalizers";
import { normalizeAssuranceCases } from "@/lib/api/assurance-normalizers";
import { normalizeIntegrations } from "@/lib/api/integration-normalizers";

export type NodeType =
  | "ai-system" | "evidence" | "risk" | "incident" | "report" | "audit-pack"
  | "questionnaire" | "trust-asset" | "policy" | "vendor" | "regulatory"
  | "certification" | "approval" | "assurance" | "integration";

export type GraphNode = {
  id: string;
  type: NodeType;
  label: string;
  status: string | null;
  owner: string | null;
  date: string | null;
  severity: string | null;
  route: string | null;
  /** real backend reference fields used for edge derivation (never rendered as claims) */
  refs: { aiSystem?: string | null; evidenceRef?: string | null; riskRef?: string | null; linkedResource?: string | null };
};

export type GraphEdge = { id: string; source: string; target: string; relationship: string };

export const NODE_META: Record<NodeType, { label: string; color: string; route: string }> = {
  "ai-system": { label: "AI System", color: "#3B82F6", route: "/dashboard/ai-systems" },
  evidence: { label: "Evidence", color: "#10B981", route: "/dashboard/evidence" },
  risk: { label: "Risk", color: "#F59E0B", route: "/dashboard/risks" },
  incident: { label: "Incident", color: "#EF4444", route: "/dashboard/incidents" },
  report: { label: "Report", color: "#6366F1", route: "/dashboard/reports" },
  "audit-pack": { label: "Audit Pack", color: "#8B5CF6", route: "/dashboard/audit-pack" },
  questionnaire: { label: "Questionnaire", color: "#06B6D4", route: "/dashboard/questionnaires" },
  "trust-asset": { label: "Trust Asset", color: "#14B8A6", route: "/dashboard/trust-center" },
  policy: { label: "Policy", color: "#0EA5E9", route: "/dashboard/policies" },
  vendor: { label: "Vendor", color: "#A855F7", route: "/dashboard/vendor-risk" },
  regulatory: { label: "Regulatory", color: "#F97316", route: "/dashboard/regulatory" },
  certification: { label: "Certification", color: "#EAB308", route: "/dashboard/certifications" },
  approval: { label: "Approval", color: "#3B82F6", route: "/dashboard/approvals" },
  assurance: { label: "Assurance", color: "#8B5CF6", route: "/dashboard/assurance" },
  integration: { label: "Integration", color: "#64748B", route: "/dashboard/integrations" }
};

export type GraphSources = Partial<Record<NodeType, unknown>>;

function nid(type: NodeType, raw: string): string {
  return `${type}:${raw}`;
}

/** Build a governance graph from REAL records and their REAL reference fields only. */
export function buildGraph(sources: GraphSources): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];

  const push = (type: NodeType, raw: string, n: Omit<GraphNode, "id" | "type" | "route" | "refs"> & { rawId?: string | null; refs?: GraphNode["refs"] }) => {
    const route = type === "ai-system" && n.rawId ? `${NODE_META[type].route}/${encodeURIComponent(n.rawId)}` : NODE_META[type].route;
    nodes.push({ id: nid(type, raw), type, route, label: n.label, status: n.status, owner: n.owner, date: n.date, severity: n.severity, refs: n.refs ?? {} });
  };

  if (sources["ai-system"] !== undefined)
    normalizeAiSystems(sources["ai-system"]).forEach((s, i) => push("ai-system", s.id || `${i}`, { label: s.name, status: s.lifecycleStage, owner: s.owner, date: s.lastAssessed, severity: s.hasRisk ? s.riskLevel : null, rawId: s.rawId }));
  if (sources.evidence !== undefined)
    normalizeEvidenceItems(sources.evidence).forEach((e, i) => push("evidence", e.id || `${i}`, { label: e.title, status: e.status, owner: e.owner, date: e.updatedAt ?? e.createdAt, severity: null, refs: { aiSystem: e.aiSystem } }));
  if (sources.risk !== undefined)
    normalizeRisks(sources.risk).forEach((r, i) => push("risk", r.id || `${i}`, { label: r.title, status: r.status, owner: r.owner, date: r.dueDate ?? r.updatedAt, severity: r.hasSeverity ? r.severity : null, refs: { aiSystem: r.aiSystem, evidenceRef: r.evidenceRef } }));
  if (sources.incident !== undefined)
    normalizeIncidents(sources.incident).forEach((n, i) => push("incident", n.id || `${i}`, { label: n.title, status: n.status, owner: n.owner, date: n.detectedAt ?? n.createdAt, severity: n.hasSeverity ? n.severity : null, refs: { aiSystem: n.aiSystem, riskRef: n.riskRef, evidenceRef: n.evidenceRef } }));
  if (sources.report !== undefined)
    normalizeReports(sources.report).forEach((r, i) => push("report", r.id || `${i}`, { label: r.title, status: r.status, owner: r.owner, date: r.createdAt, severity: null }));
  if (sources["audit-pack"] !== undefined)
    normalizeAuditPacks(sources["audit-pack"]).forEach((p, i) => push("audit-pack", p.id || `${i}`, { label: p.title, status: p.status, owner: p.owner, date: p.createdAt, severity: null }));
  if (sources.questionnaire !== undefined)
    normalizeQuestionnaires(sources.questionnaire).forEach((q, i) => push("questionnaire", q.id || `${i}`, { label: q.title, status: q.status, owner: q.owner, date: q.dueDate, severity: null }));
  if (sources["trust-asset"] !== undefined)
    normalizeTrustAssets(sources["trust-asset"]).forEach((a, i) => push("trust-asset", a.id || `${i}`, { label: a.title, status: a.status, owner: null, date: a.updatedAt ?? a.createdAt, severity: null }));
  if (sources.policy !== undefined)
    normalizePolicies(sources.policy).forEach((p, i) => push("policy", p.id || `${i}`, { label: p.name, status: p.status, owner: p.owner, date: p.lastUpdated, severity: null }));
  if (sources.vendor !== undefined)
    normalizeVendors(sources.vendor).forEach((v, i) => push("vendor", v.id || `${i}`, { label: v.name, status: v.status, owner: v.owner, date: v.lastReviewed, severity: v.riskLevel }));
  if (sources.regulatory !== undefined)
    normalizeRegulatoryDeadlines(sources.regulatory).forEach((d, i) => push("regulatory", d.id || `${i}`, { label: d.title, status: d.priority, owner: null, date: d.dueDate, severity: d.priority }));
  if (sources.certification !== undefined)
    normalizeCertifications(sources.certification).forEach((c, i) => push("certification", c.id || `${i}`, { label: c.name, status: c.status, owner: c.owner, date: c.expiryDate, severity: null }));
  if (sources.approval !== undefined)
    normalizeApprovals(sources.approval).forEach((a, i) => push("approval", a.id || `${i}`, { label: a.title, status: a.status, owner: a.reviewer ?? a.requester, date: a.createdAt, severity: a.priority, refs: { linkedResource: a.linkedResource } }));
  if (sources.assurance !== undefined)
    normalizeAssuranceCases(sources.assurance).forEach((c, i) => push("assurance", c.id || `${i}`, { label: c.title, status: c.status, owner: c.reviewer, date: c.dueDate, severity: c.priority, refs: { linkedResource: c.linkedResource } }));
  if (sources.integration !== undefined)
    normalizeIntegrations(sources.integration).forEach((g, i) => push("integration", g.id || `${i}`, { label: g.name, status: g.status, owner: null, date: g.lastSync, severity: null }));

  // ---- Edge derivation: only when a real reference field matches a real node ----
  const byId = new Map<string, GraphNode>();
  const byLabel = new Map<string, GraphNode>(); // lowercased label/raw-id lookup
  for (const n of nodes) {
    byId.set(n.id, n);
    const raw = n.id.split(":").slice(1).join(":").toLowerCase();
    if (raw) byLabel.set(raw, n);
    if (n.label) byLabel.set(n.label.toLowerCase(), n);
  }

  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  const addEdge = (sourceId: string, target: GraphNode | undefined, relationship: string) => {
    if (!target || target.id === sourceId) return;
    const key = `${sourceId}->${target.id}:${relationship}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ id: key, source: sourceId, target: target.id, relationship });
  };
  const resolve = (ref: string | null | undefined): GraphNode | undefined => {
    if (!ref) return undefined;
    const k = ref.toLowerCase();
    return byId.get(ref) ?? byLabel.get(k);
  };

  for (const n of nodes) {
    if (n.refs.aiSystem) {
      const t = resolve(n.refs.aiSystem) ?? byLabel.get(n.refs.aiSystem.toLowerCase());
      if (t && t.type === "ai-system") addEdge(n.id, t, "linked to");
    }
    if (n.refs.riskRef) addEdge(n.id, resolve(n.refs.riskRef), "relates to risk");
    if (n.refs.evidenceRef) addEdge(n.id, resolve(n.refs.evidenceRef), "backed by evidence");
    if (n.refs.linkedResource) addEdge(n.id, resolve(n.refs.linkedResource), "reviews");
  }

  return { nodes, edges };
}

const HIGH = ["critical", "high", "severe", "urgent"];
export function isHighSeverity(severity: string | null): boolean {
  if (!severity) return false;
  const s = severity.toLowerCase();
  return HIGH.some((x) => s.includes(x));
}

/** Edges where at least one endpoint is a high/critical risk or incident node. */
export function highRiskConnections(nodes: GraphNode[], edges: GraphEdge[]): number {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return edges.filter((e) => {
    const a = byId.get(e.source);
    const b = byId.get(e.target);
    return [a, b].some((n) => n && (n.type === "risk" || n.type === "incident") && isHighSeverity(n.severity));
  }).length;
}

/** Nodes with no incident edges (real unlinked records). */
export function unlinkedNodes(nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] {
  const linked = new Set<string>();
  for (const e of edges) {
    linked.add(e.source);
    linked.add(e.target);
  }
  return nodes.filter((n) => !linked.has(n.id));
}
