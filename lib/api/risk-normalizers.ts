import {
  getStringFromPaths,
  getNumberFromPaths,
  getDateFromPaths,
  normalizeList
} from "@/lib/api/normalizers";
import { severityFrom } from "@/lib/api/compliance-normalizers";
import type { Severity } from "@/lib/api/types";

export type NormalizedRisk = {
  id: string;
  rawId: string | null;
  title: string;
  severity: Severity;
  hasSeverity: boolean;
  status: string | null;
  owner: string | null;
  category: string | null;
  aiSystem: string | null;
  evidenceRef: string | null;
  mitigation: string | null;
  dueDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  score: number | null;
  impact: number | null;
  likelihood: number | null;
};

const LIST_PATHS = ["", "data", "result", "items", "results", "data.items", "risks", "risk_register", "records"];

/** Map a numeric or categorical impact/likelihood onto a 1–5 scale. Returns null when absent. */
function toScale5(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value <= 1) return Math.max(1, Math.round(value * 5));
    if (value <= 5) return Math.round(value);
    if (value <= 10) return Math.max(1, Math.round(value / 2));
    if (value <= 100) return Math.max(1, Math.round(value / 20));
    return 5;
  }
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    if (!s) return null;
    const n = Number(s);
    if (Number.isFinite(n)) return toScale5(n);
    if (/(very high|severe|critical)/.test(s)) return 5;
    if (/high|major/.test(s)) return 4;
    if (/(medium|moderate)/.test(s)) return 3;
    if (/(low|minor)/.test(s)) return 2;
    if (/(very low|negligible|rare)/.test(s)) return 1;
  }
  return null;
}

function scaleFromPaths(entry: unknown, paths: string[]): number | null {
  // try numeric first, then categorical strings
  const num = getNumberFromPaths(entry, paths);
  if (num !== null) return toScale5(num);
  const str = getStringFromPaths(entry, paths);
  return str ? toScale5(str) : null;
}

export function normalizeRisks(value: unknown): NormalizedRisk[] {
  return normalizeList(value, LIST_PATHS).map((entry, index) => {
    const sevRaw = getStringFromPaths(entry, ["severity", "risk_level", "riskLevel", "priority", "level", "risk_rating"]);
    const rawId = getStringFromPaths(entry, ["id", "uuid", "risk_id"]);
    return {
      id: rawId || `risk-${index}`,
      rawId,
      title: getStringFromPaths(entry, ["title", "name", "summary", "risk", "description"]) || "Untitled risk",
      severity: severityFrom(sevRaw),
      hasSeverity: sevRaw != null,
      status: getStringFromPaths(entry, ["status", "state", "risk_status", "stage"]),
      owner: getStringFromPaths(entry, ["owner", "owner_name", "assignee", "responsible", "risk_owner"]),
      category: getStringFromPaths(entry, ["category", "type", "domain", "risk_type", "risk_category"]),
      aiSystem: getStringFromPaths(entry, ["ai_system", "aiSystem", "system_name", "system_id", "linked_system"]),
      evidenceRef: getStringFromPaths(entry, ["evidence", "evidence_id", "linked_evidence", "evidence_ref"]),
      mitigation: getStringFromPaths(entry, ["mitigation", "remediation", "recommendation", "action", "treatment", "mitigation_plan"]),
      dueDate: getDateFromPaths(entry, ["due_date", "dueDate", "review_date", "next_review", "target_date", "deadline"]),
      createdAt: getDateFromPaths(entry, ["created_at", "createdAt", "identified_at", "opened_at"]),
      updatedAt: getDateFromPaths(entry, ["updated_at", "updatedAt", "modified_at", "last_reviewed"]),
      score: getNumberFromPaths(entry, ["risk_score", "score", "inherent_risk", "residual_risk", "rating"]),
      impact: scaleFromPaths(entry, ["impact", "business_impact", "severity_impact", "consequence"]),
      likelihood: scaleFromPaths(entry, ["likelihood", "probability", "chance", "frequency", "occurrence"])
    };
  });
}

const MITIGATED = ["mitigat", "closed", "resolved", "remediat", "done", "complete", "accepted", "treated"];

export function isMitigated(status: string | null): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return MITIGATED.some((x) => s.includes(x));
}

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const t = new Date(dueDate).getTime();
  return Number.isFinite(t) && t < Date.now();
}

export function averageRiskScore(risks: NormalizedRisk[]): number | null {
  const scored = risks.filter((r) => r.score != null);
  if (scored.length === 0) return null;
  return Math.round(scored.reduce((sum, r) => sum + (r.score as number), 0) / scored.length);
}

export type CategoryBucket = { label: string; value: number };

/** Category counts from real category/type/domain; "Uncategorized" only for real records lacking one. */
export function riskCategoryCounts(risks: NormalizedRisk[]): CategoryBucket[] {
  const counts = new Map<string, number>();
  for (const r of risks) {
    const key = r.category || "Uncategorized";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
}

export type RiskMatrix = { cells: number[][]; hasData: boolean; total: number };

/** 5×5 likelihood (row, high→low) × impact (col, low→high) heatmap. hasData only when real fields exist. */
export function buildRiskMatrix(risks: NormalizedRisk[]): RiskMatrix {
  const cells = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => 0));
  let total = 0;
  for (const r of risks) {
    if (r.impact == null || r.likelihood == null) continue;
    const col = Math.min(4, Math.max(0, r.impact - 1));
    const row = Math.min(4, Math.max(0, 5 - r.likelihood)); // likelihood 5 -> row 0 (top)
    cells[row][col] += 1;
    total += 1;
  }
  return { cells, hasData: total > 0, total };
}

export type RiskActivity = { id: string; title: string; action: string; status: string | null; timestamp: string };

export function riskActivity(risks: NormalizedRisk[]): RiskActivity[] {
  const events: RiskActivity[] = [];
  for (const r of risks) {
    const ts = r.updatedAt || r.createdAt;
    if (!ts) continue;
    const action = r.updatedAt && r.createdAt && r.updatedAt !== r.createdAt ? "Updated" : "Identified";
    events.push({ id: r.id, title: r.title, action, status: r.status, timestamp: ts });
  }
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
