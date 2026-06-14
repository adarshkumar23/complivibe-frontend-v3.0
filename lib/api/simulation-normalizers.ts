import { getStringFromPaths, getNumberFromPaths, getDateFromPaths, getArrayFromPaths, normalizeList } from "@/lib/api/normalizers";

// Reuse audited source normalizers (read-only, no fabrication).
export { normalizeSystems } from "@/lib/api/normalizers";
export { normalizeRisks } from "@/lib/api/risk-normalizers";
export { normalizeIncidents } from "@/lib/api/incident-normalizers";
export { normalizeRegulatoryDeadlines } from "@/lib/api/regulatory-normalizers";
export { normalizeEvidenceItems } from "@/lib/api/evidence-normalizers";
export { normalizeAuditPacks } from "@/lib/api/audit-pack-normalizers";
export { normalizeQuestionnaires } from "@/lib/api/questionnaire-normalizers";

/** Static scenario-type catalogue (labels only — never presented as backend results). */
export const SCENARIO_TYPES: { id: string; label: string }[] = [
  { id: "evidence-gap", label: "Evidence gap" },
  { id: "risk-escalation", label: "Risk escalation" },
  { id: "deadline-missed", label: "Deadline missed" },
  { id: "incident-unresolved", label: "Incident unresolved" },
  { id: "ai-system-high-risk", label: "AI system high-risk" },
  { id: "vendor-issue", label: "Vendor issue" },
  { id: "audit-pack-incomplete", label: "Audit pack incomplete" }
];

/* ----------------------------- Simulation results (backend only) ----------------------------- */
export type SimulationResult = {
  id: string;
  name: string;
  scenarioType: string | null;
  status: string | null;
  impactScore: number | null;
  affectedSystems: string[];
  affectedEvidence: number | null;
  affectedRisks: number | null;
  affectedDeadlines: number | null;
  recommendations: string[];
  createdAt: string | null;
};

const SIM_LIST_PATHS = ["", "data", "result", "items", "results", "data.items", "simulations", "scenarios", "runs", "records"];

function strList(entry: unknown, paths: string[]): string[] {
  const out: string[] = [];
  for (const p of paths) {
    for (const v of getArrayFromPaths(entry, [p])) {
      const t = typeof v === "string" ? v : getStringFromPaths(v, ["name", "title", "label", "system", "system_name", "action", "recommendation"]);
      if (t) out.push(t);
    }
    if (out.length) break;
  }
  return out;
}

export function normalizeSimulations(value: unknown): SimulationResult[] {
  return normalizeList(value, SIM_LIST_PATHS).map((entry, i) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "simulation_id", "scenario_id", "run_id"]) || `simulation-${i}`,
    name: getStringFromPaths(entry, ["name", "title", "scenario_name", "scenario", "label"]) || "Scenario simulation",
    scenarioType: getStringFromPaths(entry, ["scenario_type", "type", "category", "kind"]),
    status: getStringFromPaths(entry, ["status", "state", "result_status"]),
    impactScore: getNumberFromPaths(entry, ["impact_score", "impact", "score", "severity_score", "risk_score"]),
    affectedSystems: strList(entry, ["affected_systems", "systems", "impacted_systems", "ai_systems"]),
    affectedEvidence: getNumberFromPaths(entry, ["affected_evidence", "evidence_count", "impacted_evidence"]),
    affectedRisks: getNumberFromPaths(entry, ["affected_risks", "risk_count", "impacted_risks"]),
    affectedDeadlines: getNumberFromPaths(entry, ["affected_deadlines", "deadline_count", "impacted_deadlines"]),
    recommendations: strList(entry, ["recommendations", "recommended_actions", "actions", "suggestions"]),
    createdAt: getDateFromPaths(entry, ["created_at", "createdAt", "run_at", "ran_at", "executed_at", "date"])
  }));
}

/** Count simulation results carrying a real impact value. */
export function simulatedImpactCount(results: SimulationResult[]): number {
  return results.filter((r) => r.impactScore != null).length;
}

/** Distinct affected systems across all backend simulation results. */
export function affectedSystemCount(results: SimulationResult[]): number | null {
  const set = new Set<string>();
  for (const r of results) for (const s of r.affectedSystems) set.add(s);
  return set.size > 0 ? set.size : null;
}

export function impactTone(score: number | null): "good" | "warn" | "bad" | "neutral" {
  if (score == null) return "neutral";
  if (score >= 70) return "bad";
  if (score >= 40) return "warn";
  return "good";
}
