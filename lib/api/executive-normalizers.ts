import { getStringFromPaths, getArrayFromPaths } from "@/lib/api/normalizers";
import { normalizeRisks, isMitigated } from "@/lib/api/risk-normalizers";
import { normalizeIncidents, isResolved } from "@/lib/api/incident-normalizers";
import { normalizeRegulatoryDeadlines } from "@/lib/api/regulatory-normalizers";
import { normalizeQuestionnaires } from "@/lib/api/questionnaire-normalizers";
import { normalizeApprovals, isPending } from "@/lib/api/approval-normalizers";

export { normalizeScoreComponents, overallScore, scoreFrom } from "@/lib/api/score-explainer-normalizers";
export type { ScoreComponents } from "@/lib/api/score-explainer-normalizers";

/* ----------------------------- Backend brief ----------------------------- */
export type ExecutiveBrief = { summary: string | null; highlights: string[] };

/** Read a backend-provided executive narrative when present. Never fabricated. */
export function normalizeExecutiveBrief(value: unknown): ExecutiveBrief {
  const summary = getStringFromPaths(value, ["summary", "executive_summary", "narrative", "overview", "brief", "headline"]);
  const highlightsArr = getArrayFromPaths(value, ["highlights", "key_points", "takeaways", "bullets", "summary_points"]);
  const highlights = highlightsArr
    .map((h) => (typeof h === "string" ? h : getStringFromPaths(h, ["text", "title", "point", "message", "label"])))
    .filter((v): v is string => Boolean(v));
  return { summary, highlights };
}

/* ----------------------------- Derived brief stats ----------------------------- */
export type BriefStat = { key: string; label: string; value: number; route: string };

export type ExecSources = Partial<Record<
  "aiSystems" | "risks" | "incidents" | "evidence" | "regulatory" | "auditPacks" | "reports" | "questionnaires" | "approvals" | "assurance",
  unknown
>>;

function count(value: unknown, listExtra: string[] = []): number {
  return getArrayFromPaths(value, ["", "data", "result", "items", "results", "data.items", ...listExtra]).length;
}

/** Factual counts from real records only. Each stat is included only when its source is provided. */
export function buildBriefStats(s: ExecSources): BriefStat[] {
  const out: BriefStat[] = [];
  if (s.aiSystems !== undefined) out.push({ key: "ai-systems", label: "AI systems tracked", value: count(s.aiSystems, ["systems", "ai_systems"]), route: "/dashboard/ai-systems" });
  if (s.risks !== undefined) out.push({ key: "open-risks", label: "Open risks", value: normalizeRisks(s.risks).filter((r) => !isMitigated(r.status)).length, route: "/dashboard/risks" });
  if (s.incidents !== undefined) out.push({ key: "incidents", label: "Unresolved incidents", value: normalizeIncidents(s.incidents).filter((i) => !isResolved(i.status)).length, route: "/dashboard/incidents" });
  if (s.evidence !== undefined) out.push({ key: "evidence", label: "Evidence records", value: count(s.evidence, ["evidence"]), route: "/dashboard/evidence" });
  if (s.regulatory !== undefined) out.push({ key: "deadlines", label: "Upcoming deadlines", value: normalizeRegulatoryDeadlines(s.regulatory).filter((d) => d.daysRemaining != null && d.daysRemaining >= 0).length, route: "/dashboard/regulatory" });
  if (s.auditPacks !== undefined) out.push({ key: "audit-packs", label: "Audit packs", value: count(s.auditPacks, ["audit_packs", "packs"]), route: "/dashboard/audit-pack" });
  if (s.reports !== undefined) out.push({ key: "reports", label: "Reports", value: count(s.reports, ["reports"]), route: "/dashboard/reports" });
  if (s.questionnaires !== undefined) out.push({ key: "questionnaires", label: "Questionnaires", value: count(s.questionnaires, ["questionnaires"]), route: "/dashboard/questionnaires" });
  if (s.approvals !== undefined) out.push({ key: "approvals", label: "Pending approvals", value: normalizeApprovals(s.approvals).filter(isPending).length, route: "/dashboard/approvals" });
  return out;
}

/* ----------------------------- Top executive risks ----------------------------- */
export type ExecRisk = { id: string; title: string; severity: string | null; status: string | null; linked: string | null; dueDate: string | null; kind: "Risk" | "Incident"; route: string };

const SEV_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
function rank(sev: string | null): number {
  if (!sev) return 5;
  return SEV_RANK[sev.toLowerCase()] ?? 5;
}

export function topExecutiveRisks(risksData: unknown, incidentsData: unknown): ExecRisk[] {
  const risks: ExecRisk[] = normalizeRisks(risksData)
    .filter((r) => !isMitigated(r.status))
    .map((r) => ({ id: `r-${r.id}`, title: r.title, severity: r.hasSeverity ? r.severity : null, status: r.status, linked: r.aiSystem, dueDate: r.dueDate, kind: "Risk" as const, route: "/dashboard/risks" }));
  const incs: ExecRisk[] = normalizeIncidents(incidentsData)
    .filter((i) => !isResolved(i.status))
    .map((i) => ({ id: `i-${i.id}`, title: i.title, severity: i.hasSeverity ? i.severity : null, status: i.status, linked: i.aiSystem, dueDate: i.dueDate, kind: "Incident" as const, route: "/dashboard/incidents" }));
  return [...risks, ...incs].sort((a, b) => rank(a.severity) - rank(b.severity));
}

/* ----------------------------- Upcoming deadlines ----------------------------- */
export type ExecDeadline = { id: string; title: string; date: string | null; daysRemaining: number | null; source: string; priority: string | null; route: string };

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export function upcomingDeadlines(regulatoryData: unknown, questionnairesData: unknown, approvalsData: unknown): ExecDeadline[] {
  const out: ExecDeadline[] = [];
  for (const d of normalizeRegulatoryDeadlines(regulatoryData)) {
    if (!d.dueDate) continue;
    out.push({ id: `reg-${d.id}`, title: d.title, date: d.dueDate, daysRemaining: d.daysRemaining, source: "Regulatory", priority: d.priority, route: "/dashboard/regulatory" });
  }
  for (const q of normalizeQuestionnaires(questionnairesData)) {
    if (!q.dueDate) continue;
    out.push({ id: `q-${q.id}`, title: q.title, date: q.dueDate, daysRemaining: daysUntil(q.dueDate), source: "Questionnaire", priority: null, route: "/dashboard/questionnaires" });
  }
  for (const a of normalizeApprovals(approvalsData)) {
    if (!a.dueDate) continue;
    out.push({ id: `a-${a.id}`, title: a.title, date: a.dueDate, daysRemaining: daysUntil(a.dueDate), source: "Approval", priority: a.priority, route: "/dashboard/approvals" });
  }
  return out.sort((x, y) => (x.daysRemaining ?? Infinity) - (y.daysRemaining ?? Infinity));
}
