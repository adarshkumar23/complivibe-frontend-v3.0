import {
  getStringFromPaths,
  getNumberFromPaths,
  getDateFromPaths,
  normalizeList
} from "@/lib/api/normalizers";
import { severityFrom } from "@/lib/api/compliance-normalizers";
import type { Severity } from "@/lib/api/types";

export type NormalizedAiSystem = {
  id: string;
  name: string;
  owner: string | null;
  useCase: string | null;
  riskLevel: Severity;
  hasRisk: boolean;
  lifecycleStage: string | null;
  score: number | null;
  lastAssessed: string | null;
};

const LIST_PATHS = ["", "data", "result", "items", "results", "systems", "ai_systems", "data.items", "data.systems"];

export function normalizeAiSystems(value: unknown): NormalizedAiSystem[] {
  return normalizeList(value, LIST_PATHS).map((entry, index) => {
    const riskRaw = getStringFromPaths(entry, ["risk_level", "riskLevel", "severity", "priority", "risk", "risk_rating"]);
    return {
      id: getStringFromPaths(entry, ["id", "uuid", "system_id", "model_id"]) || `system-${index}`,
      name: getStringFromPaths(entry, ["name", "system_name", "title", "model_name"]) || "Unnamed system",
      owner: getStringFromPaths(entry, ["owner", "owner_name", "team", "business_owner", "responsible", "owned_by"]),
      useCase: getStringFromPaths(entry, ["use_case", "useCase", "purpose", "description", "category", "function"]),
      riskLevel: severityFrom(riskRaw),
      hasRisk: riskRaw != null,
      lifecycleStage: getStringFromPaths(entry, [
        "lifecycle_stage",
        "lifecycleStage",
        "stage",
        "status",
        "phase",
        "lifecycle"
      ]),
      score: getNumberFromPaths(entry, [
        "governance_score",
        "compliance_score",
        "score",
        "health_score",
        "risk_score",
        "trust_score"
      ]),
      lastAssessed: getDateFromPaths(entry, [
        "last_assessed",
        "lastAssessed",
        "assessed_at",
        "last_reviewed",
        "updated_at",
        "updatedAt",
        "created_at",
        "createdAt"
      ])
    };
  });
}

export type DistributionBucket = { label: string; value: number; color: string };

const RISK_COLORS: Record<Severity, string> = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#F59E0B",
  low: "#10B981",
  info: "#3B82F6"
};

/** Real counts of systems per risk level (only buckets that actually occur). */
export function riskDistribution(systems: NormalizedAiSystem[]): DistributionBucket[] {
  const order: Severity[] = ["critical", "high", "medium", "low", "info"];
  const labels: Record<Severity, string> = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
    info: "Unrated"
  };
  const counts = new Map<Severity, number>();
  for (const s of systems) {
    if (!s.hasRisk) {
      counts.set("info", (counts.get("info") ?? 0) + 1);
      continue;
    }
    counts.set(s.riskLevel, (counts.get(s.riskLevel) ?? 0) + 1);
  }
  return order
    .filter((sev) => (counts.get(sev) ?? 0) > 0)
    .map((sev) => ({ label: labels[sev], value: counts.get(sev) as number, color: RISK_COLORS[sev] }));
}

/** Real counts of systems per lifecycle stage label (verbatim from backend). */
export function lifecycleDistribution(systems: NormalizedAiSystem[]): DistributionBucket[] {
  const palette = ["#3B82F6", "#8B5CF6", "#06B6D4", "#14B8A6", "#10B981", "#F59E0B", "#EF4444"];
  const counts = new Map<string, number>();
  for (const s of systems) {
    if (!s.lifecycleStage) continue;
    const key = s.lifecycleStage;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i) => ({ label, value, color: palette[i % palette.length] }));
}

const ACTIVE_STAGES = ["monitor", "production", "live", "active", "deployed", "operational", "running"];

export function isActiveMonitoring(stage: string | null): boolean {
  if (!stage) return false;
  const s = stage.toLowerCase();
  return ACTIVE_STAGES.some((x) => s.includes(x));
}

/** Average of real governance scores present on systems (null when none reported). */
export function averageScore(systems: NormalizedAiSystem[]): number | null {
  const scored = systems.filter((s) => s.score != null);
  if (scored.length === 0) return null;
  return Math.round(scored.reduce((sum, s) => sum + (s.score as number), 0) / scored.length);
}
