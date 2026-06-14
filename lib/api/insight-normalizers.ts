import { getStringFromPaths, normalizeList } from "@/lib/api/normalizers";
import { normalizeRisks, isMitigated } from "@/lib/api/risk-normalizers";
import { normalizeIncidents, isResolved } from "@/lib/api/incident-normalizers";
import { normalizeRegulatoryDeadlines } from "@/lib/api/regulatory-normalizers";
import { normalizeQuestionnaires, isComplete as questionnaireComplete } from "@/lib/api/questionnaire-normalizers";
import { normalizeAiSystems } from "@/lib/api/ai-system-normalizers";
import { normalizeApprovals, isPending } from "@/lib/api/approval-normalizers";
import { normalizeAssuranceCases, isComplete as assuranceComplete } from "@/lib/api/assurance-normalizers";

export type InsightCategoryKey =
  | "risks" | "incidents" | "evidence" | "deadlines" | "alerts"
  | "questionnaires" | "ai-systems" | "approvals" | "assurance" | "trust-center";

export type Insight = {
  id: string;
  title: string;
  description: string | null;
  severity: string | null;
  category: InsightCategoryKey;
  categoryLabel: string;
  recommendation: string | null;
  route: string | null;
  origin: "backend" | "derived";
};

const CAT_LABEL: Record<InsightCategoryKey, { label: string; route: string }> = {
  risks: { label: "Risks", route: "/dashboard/risks" },
  incidents: { label: "Incidents", route: "/dashboard/incidents" },
  evidence: { label: "Evidence", route: "/dashboard/evidence" },
  deadlines: { label: "Regulatory", route: "/dashboard/regulatory" },
  alerts: { label: "Alerts", route: "/dashboard/alerts" },
  questionnaires: { label: "Questionnaires", route: "/dashboard/questionnaires" },
  "ai-systems": { label: "AI Systems", route: "/dashboard/ai-systems" },
  approvals: { label: "Approvals", route: "/dashboard/approvals" },
  assurance: { label: "Assurance", route: "/dashboard/assurance" },
  "trust-center": { label: "Trust Center", route: "/dashboard/trust-center" }
};

function resolveCategory(raw: string | null): InsightCategoryKey {
  const c = (raw || "").toLowerCase();
  if (/incident/.test(c)) return "incidents";
  if (/evidence/.test(c)) return "evidence";
  if (/regulat|deadline/.test(c)) return "deadlines";
  if (/alert/.test(c)) return "alerts";
  if (/question/.test(c)) return "questionnaires";
  if (/(ai|model|system)/.test(c)) return "ai-systems";
  if (/approval/.test(c)) return "approvals";
  if (/assurance|review/.test(c)) return "assurance";
  if (/trust/.test(c)) return "trust-center";
  return "risks";
}

/** Backend-provided proactive insights. Reads real fields only. */
export function normalizeBackendInsights(value: unknown): Insight[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "data.items", "insights", "records"]).map((entry, i) => {
    const catRaw = getStringFromPaths(entry, ["category", "type", "module", "source", "domain"]);
    const cat = resolveCategory(catRaw);
    return {
      id: `backend-${getStringFromPaths(entry, ["id", "uuid", "insight_id"]) ?? i}`,
      title: getStringFromPaths(entry, ["title", "name", "headline", "summary", "message"]) || "Insight",
      description: getStringFromPaths(entry, ["description", "detail", "details", "explanation", "body"]),
      severity: getStringFromPaths(entry, ["severity", "priority", "level", "impact"]),
      category: cat,
      categoryLabel: catRaw || CAT_LABEL[cat].label,
      recommendation: getStringFromPaths(entry, ["recommendation", "recommended_action", "action", "next_step", "suggestion"]),
      route: CAT_LABEL[cat].route,
      origin: "backend"
    };
  });
}

export type InsightSources = Partial<Record<"risks" | "incidents" | "regulatory" | "questionnaires" | "aiSystems" | "approvals" | "assurance" | "evidence", unknown>>;

function isHighSev(sev: string): boolean {
  return /(critical|high)/i.test(sev);
}

/** Derive factual insights from REAL records only. Titles/recommendations are simple factual next steps. */
export function buildDerivedInsights(s: InsightSources): Insight[] {
  const out: Insight[] = [];
  const mk = (cat: InsightCategoryKey, id: string, title: string, description: string | null, severity: string | null, recommendation: string): Insight => ({
    id: `derived-${cat}-${id}`, title, description, severity, category: cat, categoryLabel: CAT_LABEL[cat].label, recommendation, route: CAT_LABEL[cat].route, origin: "derived"
  });

  if (s.risks !== undefined) {
    for (const r of normalizeRisks(s.risks)) {
      if (isMitigated(r.status)) continue;
      // High risk without linked evidence (both fields real).
      if (r.hasSeverity && isHighSev(r.severity) && !r.evidenceRef) {
        out.push(mk("risks", r.id, r.title, "Open high/critical risk with no linked evidence.", r.severity, "Attach evidence"));
      }
    }
  }
  if (s.incidents !== undefined) {
    for (const i of normalizeIncidents(s.incidents)) {
      if (isResolved(i.status)) continue;
      out.push(mk("incidents", i.id, i.title, i.aiSystem ? `Open incident on ${i.aiSystem}.` : "Incident is still open.", i.hasSeverity ? i.severity : null, "Open incident"));
    }
  }
  if (s.regulatory !== undefined) {
    for (const d of normalizeRegulatoryDeadlines(s.regulatory)) {
      if (d.daysRemaining == null) continue;
      if (d.daysRemaining < 0) out.push(mk("deadlines", d.id, d.title, "Regulatory deadline is overdue.", d.priority ?? "high", "Check deadline"));
      else if (d.daysRemaining <= 30) out.push(mk("deadlines", d.id, d.title, `Deadline due in ${d.daysRemaining} day${d.daysRemaining === 1 ? "" : "s"}.`, d.priority, "Check deadline"));
    }
  }
  if (s.questionnaires !== undefined) {
    for (const q of normalizeQuestionnaires(s.questionnaires)) {
      if (questionnaireComplete(q)) continue;
      const overdue = q.dueDate ? new Date(q.dueDate).getTime() < Date.now() : false;
      if (q.status || q.dueDate) out.push(mk("questionnaires", q.id, q.title, overdue ? "Questionnaire is overdue." : "Questionnaire is not complete.", overdue ? "high" : null, "Open questionnaire"));
    }
  }
  if (s.aiSystems !== undefined && s.risks !== undefined) {
    const systems = normalizeAiSystems(s.aiSystems);
    const openRisks = normalizeRisks(s.risks).filter((r) => !isMitigated(r.status));
    for (const sys of systems) {
      const keys = [sys.name?.toLowerCase(), sys.rawId?.toLowerCase()].filter(Boolean) as string[];
      const linked = openRisks.filter((r) => r.aiSystem && keys.includes(r.aiSystem.toLowerCase())).length;
      if (linked > 0) out.push(mk("ai-systems", sys.id, sys.name, `${linked} open risk${linked === 1 ? "" : "s"} linked to this system.`, sys.hasRisk ? sys.riskLevel : null, "Review AI system"));
    }
  }
  if (s.approvals !== undefined) {
    for (const a of normalizeApprovals(s.approvals)) {
      if (!isPending(a)) continue;
      out.push(mk("approvals", a.id, a.title, "Approval is pending a decision.", a.priority, "Review approval"));
    }
  }
  if (s.assurance !== undefined) {
    for (const c of normalizeAssuranceCases(s.assurance)) {
      if (assuranceComplete(c)) continue;
      out.push(mk("assurance", c.id, c.title, "Assurance review is open.", c.priority, "Review case"));
    }
  }
  return out;
}

export function insightSeverityTone(severity: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!severity) return "neutral";
  const v = severity.toLowerCase();
  if (/(critical|high|urgent|severe)/.test(v)) return "bad";
  if (/(medium|moderate)/.test(v)) return "warn";
  if (/(low|minor|info)/.test(v)) return "good";
  return "neutral";
}

export function isHighPriorityInsight(i: Insight): boolean {
  return i.severity != null && /(critical|high|urgent|severe)/i.test(i.severity);
}

/** Real source contribution counts from a built insight list. */
export function insightSourceMap(insights: Insight[]): { key: InsightCategoryKey; label: string; count: number }[] {
  const m = new Map<InsightCategoryKey, number>();
  for (const i of insights) m.set(i.category, (m.get(i.category) ?? 0) + 1);
  return [...m.entries()].map(([key, count]) => ({ key, label: CAT_LABEL[key].label, count })).sort((a, b) => b.count - a.count);
}
