import {
  getStringFromPaths,
  getNumberFromPaths,
  getDateFromPaths,
  normalizeList
} from "@/lib/api/normalizers";
import { severityFrom } from "@/lib/api/compliance-normalizers";
import type { Severity } from "@/lib/api/types";

export { normalizeTelemetry } from "@/lib/api/ai-system-detail-normalizers";
export type { TelemetrySeries } from "@/lib/api/ai-system-detail-normalizers";

/** Extra drift fields read only when the telemetry payload provides them. */
export type DriftDetail = {
  score: number | null;
  status: string | null;
  featureDrift: number | null;
  dataDrift: number | null;
  modelDrift: number | null;
  lastChecked: string | null;
  severity: string | null;
  recommendation: string | null;
};

export function driftDetail(value: unknown, baseValue: number | null, baseStatus: string | null): DriftDetail {
  return {
    score: baseValue ?? getNumberFromPaths(value, ["drift_score", "psi", "score"]),
    status: baseStatus ?? getStringFromPaths(value, ["drift_status", "status", "state"]),
    featureDrift: getNumberFromPaths(value, ["feature_drift", "feature_drift_score", "input_drift"]),
    dataDrift: getNumberFromPaths(value, ["data_drift", "data_drift_score", "covariate_drift"]),
    modelDrift: getNumberFromPaths(value, ["model_drift", "behavior_drift", "concept_drift", "prediction_drift"]),
    lastChecked: getDateFromPaths(value, ["last_checked", "checked_at", "timestamp", "updated_at", "evaluated_at"]),
    severity: getStringFromPaths(value, ["severity", "risk_level", "priority"]),
    recommendation: getStringFromPaths(value, ["recommendation", "recommended_action", "action", "remediation"])
  };
}

const HIGH_DRIFT = ["high", "critical", "severe", "unstable", "alert"];

export function isHighRiskDrift(detail: DriftDetail): boolean {
  const s = `${detail.severity || ""} ${detail.status || ""}`.toLowerCase();
  return HIGH_DRIFT.some((x) => s.includes(x));
}

export function driftTone(detail: DriftDetail): "good" | "warn" | "bad" | "neutral" {
  const s = `${detail.severity || ""} ${detail.status || ""}`.toLowerCase();
  if (!s.trim()) return "neutral";
  if (isHighRiskDrift(detail)) return "bad";
  if (/(medium|moderate|drifting|warning)/.test(s)) return "warn";
  if (/(stable|low|none|ok|healthy|nominal)/.test(s)) return "good";
  return "neutral";
}

/** Drift signals from a drift payload's signal/event array. Empty when none. */
export type DriftSignal = {
  id: string;
  name: string;
  type: string | null;
  severity: Severity;
  hasSeverity: boolean;
  confidence: number | null;
  source: string | null;
  timestamp: string | null;
  linkedSystem: string | null;
};

export function normalizeDriftSignals(value: unknown, linkedSystem: string | null): DriftSignal[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "signals", "events", "alerts", "drift_signals"]).map((entry, index) => {
    const sevRaw = getStringFromPaths(entry, ["severity", "priority", "risk_level", "level"]);
    return {
      id: getStringFromPaths(entry, ["id", "uuid", "signal_id"]) || `drift-signal-${index}`,
      name: getStringFromPaths(entry, ["name", "title", "signal", "metric", "feature", "description"]) || "Drift signal",
      type: getStringFromPaths(entry, ["type", "drift_type", "category", "kind"]),
      severity: severityFrom(sevRaw),
      hasSeverity: sevRaw != null,
      confidence: getNumberFromPaths(entry, ["confidence", "confidence_score", "probability", "score"]),
      source: getStringFromPaths(entry, ["source", "detector", "method", "origin"]),
      timestamp: getDateFromPaths(entry, ["timestamp", "detected_at", "created_at", "checked_at", "date"]),
      linkedSystem: getStringFromPaths(entry, ["system", "system_name", "ai_system", "model"]) || linkedSystem
    };
  });
}
