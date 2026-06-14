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
import { normalizeAlerts } from "@/lib/api/normalizers";
import { normalizeApprovals } from "@/lib/api/approval-normalizers";
import { normalizeAssuranceCases } from "@/lib/api/assurance-normalizers";
import { normalizeIntegrations } from "@/lib/api/integration-normalizers";
import { normalizeAutomationRules } from "@/lib/api/automation-normalizers";
import { normalizeWorkflows } from "@/lib/api/workflow-normalizers";

export type SearchCategoryKey =
  | "ai-systems" | "evidence" | "risks" | "incidents" | "reports" | "audit-packs"
  | "questionnaires" | "trust-center" | "policies" | "vendors" | "regulatory"
  | "certifications" | "alerts" | "approvals" | "assurance" | "integrations"
  | "automation" | "workflows";

export type SearchRecord = {
  id: string;
  title: string;
  categoryKey: SearchCategoryKey;
  category: string;
  type: string | null;
  status: string | null;
  owner: string | null;
  date: string | null;
  linkedResource: string | null;
  description: string | null;
  route: string | null;
};

/** Static label + list route per category. Routes are real, existing dashboard pages only. */
export const CATEGORY_META: Record<SearchCategoryKey, { label: string; route: string }> = {
  "ai-systems": { label: "AI Systems", route: "/dashboard/ai-systems" },
  evidence: { label: "Evidence", route: "/dashboard/evidence" },
  risks: { label: "Risks", route: "/dashboard/risks" },
  incidents: { label: "Incidents", route: "/dashboard/incidents" },
  reports: { label: "Reports", route: "/dashboard/reports" },
  "audit-packs": { label: "Audit Packs", route: "/dashboard/audit-pack" },
  questionnaires: { label: "Questionnaires", route: "/dashboard/questionnaires" },
  "trust-center": { label: "Trust Center", route: "/dashboard/trust-center" },
  policies: { label: "Policies", route: "/dashboard/policies" },
  vendors: { label: "Vendors", route: "/dashboard/vendor-risk" },
  regulatory: { label: "Regulatory", route: "/dashboard/regulatory" },
  certifications: { label: "Certifications", route: "/dashboard/certifications" },
  alerts: { label: "Alerts", route: "/dashboard/alerts" },
  approvals: { label: "Approvals", route: "/dashboard/approvals" },
  assurance: { label: "Assurance", route: "/dashboard/assurance" },
  integrations: { label: "Integrations", route: "/dashboard/integrations" },
  automation: { label: "Automation", route: "/dashboard/automation" },
  workflows: { label: "Workflows", route: "/dashboard/workflows" }
};

function rec(
  key: SearchCategoryKey,
  index: number,
  fields: Omit<SearchRecord, "id" | "categoryKey" | "category" | "route"> & { id?: string; route?: string | null }
): SearchRecord {
  return {
    id: `${key}-${fields.id ?? index}`,
    categoryKey: key,
    category: CATEGORY_META[key].label,
    route: fields.route !== undefined ? fields.route : CATEGORY_META[key].route,
    title: fields.title,
    type: fields.type,
    status: fields.status,
    owner: fields.owner,
    date: fields.date,
    linkedResource: fields.linkedResource,
    description: fields.description
  };
}

export type SearchSources = Partial<Record<SearchCategoryKey, unknown>>;

/** Build a unified search index from REAL records returned by each module endpoint. */
export function buildSearchIndex(sources: SearchSources): SearchRecord[] {
  const out: SearchRecord[] = [];
  const base = (key: SearchCategoryKey) => CATEGORY_META[key].route;

  if (sources["ai-systems"] !== undefined) {
    normalizeAiSystems(sources["ai-systems"]).forEach((s, i) =>
      out.push(rec("ai-systems", i, { id: s.id, title: s.name, type: s.useCase, status: s.lifecycleStage, owner: s.owner, date: s.lastAssessed, linkedResource: null, description: s.useCase, route: s.rawId ? `${base("ai-systems")}/${encodeURIComponent(s.rawId)}` : base("ai-systems") }))
    );
  }
  if (sources.evidence !== undefined) {
    normalizeEvidenceItems(sources.evidence).forEach((e, i) =>
      out.push(rec("evidence", i, { id: e.id, title: e.title, type: e.type, status: e.status, owner: e.owner, date: e.updatedAt ?? e.createdAt, linkedResource: e.control ?? e.framework, description: null }))
    );
  }
  if (sources.risks !== undefined) {
    normalizeRisks(sources.risks).forEach((r, i) =>
      out.push(rec("risks", i, { id: r.id, title: r.title, type: r.category, status: r.status, owner: r.owner, date: r.dueDate ?? r.updatedAt, linkedResource: r.aiSystem, description: r.mitigation }))
    );
  }
  if (sources.incidents !== undefined) {
    normalizeIncidents(sources.incidents).forEach((n, i) =>
      out.push(rec("incidents", i, { id: n.id, title: n.title, type: n.category, status: n.status, owner: n.owner, date: n.detectedAt ?? n.createdAt, linkedResource: n.aiSystem, description: n.description }))
    );
  }
  if (sources.reports !== undefined) {
    normalizeReports(sources.reports).forEach((r, i) =>
      out.push(rec("reports", i, { id: r.id, title: r.title, type: r.type ?? r.framework, status: r.status, owner: r.owner, date: r.createdAt, linkedResource: r.framework, description: null }))
    );
  }
  if (sources["audit-packs"] !== undefined) {
    normalizeAuditPacks(sources["audit-packs"]).forEach((p, i) =>
      out.push(rec("audit-packs", i, { id: p.id, title: p.title, type: p.framework, status: p.status, owner: p.owner, date: p.createdAt, linkedResource: p.framework, description: null }))
    );
  }
  if (sources.questionnaires !== undefined) {
    normalizeQuestionnaires(sources.questionnaires).forEach((q, i) =>
      out.push(rec("questionnaires", i, { id: q.id, title: q.title, type: q.type, status: q.status, owner: q.owner, date: q.dueDate ?? q.updatedAt, linkedResource: q.customer, description: null }))
    );
  }
  if (sources["trust-center"] !== undefined) {
    normalizeTrustAssets(sources["trust-center"]).forEach((a, i) =>
      out.push(rec("trust-center", i, { id: a.id, title: a.title, type: a.type, status: a.status, owner: null, date: a.updatedAt ?? a.createdAt, linkedResource: a.visibility, description: null }))
    );
  }
  if (sources.policies !== undefined) {
    normalizePolicies(sources.policies).forEach((p, i) =>
      out.push(rec("policies", i, { id: p.id, title: p.name, type: p.category ?? p.framework, status: p.status, owner: p.owner, date: p.lastUpdated, linkedResource: p.framework, description: null }))
    );
  }
  if (sources.vendors !== undefined) {
    normalizeVendors(sources.vendors).forEach((v, i) =>
      out.push(rec("vendors", i, { id: v.id, title: v.name, type: v.category, status: v.status ?? v.riskLevel, owner: v.owner, date: v.lastReviewed, linkedResource: null, description: null }))
    );
  }
  if (sources.regulatory !== undefined) {
    normalizeRegulatoryDeadlines(sources.regulatory).forEach((d, i) =>
      out.push(rec("regulatory", i, { id: d.id, title: d.title, type: d.framework, status: d.priority, owner: null, date: d.dueDate, linkedResource: d.jurisdiction, description: d.linkedObligation }))
    );
  }
  if (sources.certifications !== undefined) {
    normalizeCertifications(sources.certifications).forEach((c, i) =>
      out.push(rec("certifications", i, { id: c.id, title: c.name, type: c.framework, status: c.status, owner: c.owner, date: c.expiryDate ?? c.issueDate, linkedResource: c.framework, description: null }))
    );
  }
  if (sources.alerts !== undefined) {
    normalizeAlerts(undefined, sources.alerts).forEach((a, i) =>
      out.push(rec("alerts", i, { id: a.id, title: a.title, type: null, status: a.hasSeverity ? a.severity : null, owner: null, date: a.timestamp, linkedResource: null, description: a.description }))
    );
  }
  if (sources.approvals !== undefined) {
    normalizeApprovals(sources.approvals).forEach((a, i) =>
      out.push(rec("approvals", i, { id: a.id, title: a.title, type: a.type, status: a.status, owner: a.reviewer ?? a.requester, date: a.createdAt ?? a.dueDate, linkedResource: a.linkedResource, description: null }))
    );
  }
  if (sources.assurance !== undefined) {
    normalizeAssuranceCases(sources.assurance).forEach((c, i) =>
      out.push(rec("assurance", i, { id: c.id, title: c.title, type: c.type, status: c.status, owner: c.reviewer, date: c.dueDate, linkedResource: c.linkedResource, description: null }))
    );
  }
  if (sources.integrations !== undefined) {
    normalizeIntegrations(sources.integrations).forEach((g, i) =>
      out.push(rec("integrations", i, { id: g.id, title: g.name, type: g.type, status: g.status, owner: null, date: g.lastSync, linkedResource: null, description: null }))
    );
  }
  if (sources.automation !== undefined) {
    normalizeAutomationRules(sources.automation).forEach((a, i) =>
      out.push(rec("automation", i, { id: a.id, title: a.name, type: a.triggerType, status: a.status, owner: a.owner, date: a.lastRun, linkedResource: a.linkedResource, description: null }))
    );
  }
  if (sources.workflows !== undefined) {
    normalizeWorkflows(sources.workflows).forEach((w, i) =>
      out.push(rec("workflows", i, { id: w.id, title: w.name, type: w.type, status: w.status, owner: w.owner, date: w.createdAt, linkedResource: w.linkedResource, description: null }))
    );
  }

  return out;
}

/** Lowercase searchable text for a record (real fields only). */
export function searchText(r: SearchRecord): string {
  return [r.title, r.category, r.type, r.status, r.owner, r.linkedResource, r.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function countByCategory(records: SearchRecord[]): Map<SearchCategoryKey, number> {
  const m = new Map<SearchCategoryKey, number>();
  for (const r of records) m.set(r.categoryKey, (m.get(r.categoryKey) ?? 0) + 1);
  return m;
}
