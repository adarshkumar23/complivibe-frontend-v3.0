import {
  getStringFromPaths,
  getNumberFromPaths,
  getDateFromPaths,
  normalizeList
} from "@/lib/api/normalizers";
import type { Severity, UnknownRecord } from "@/lib/api/types";

export type NormalizedFramework = {
  id: string;
  name: string;
  coverage: number | null;
  status: string | null;
  controlsTotal: number | null;
  controlsMet: number | null;
};

export type NormalizedObligation = {
  id: string;
  title: string;
  status: string | null;
  severity: Severity;
  framework: string | null;
  dueDate: string | null;
};

export type PriorityAction = {
  id: string;
  title: string;
  description: string | null;
  severity: Severity;
};

export type ComplianceActivity = {
  id: string;
  title: string;
  type: string | null;
  timestamp: string | null;
  status: string | null;
  severity: Severity | null;
};

export function severityFrom(value: string | null): Severity {
  const raw = (value || "").toLowerCase();
  if (raw.includes("critical")) return "critical";
  if (raw.includes("high")) return "high";
  if (raw.includes("medium") || raw.includes("moderate") || raw.includes("amber")) return "medium";
  if (raw.includes("low") || raw.includes("minor")) return "low";
  return "info";
}

export function normalizeFrameworks(value: unknown): NormalizedFramework[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "frameworks"]).map((entry, index) => {
    const total = getNumberFromPaths(entry, ["controls_total", "total_controls", "controls.total", "total"]);
    const met = getNumberFromPaths(entry, ["controls_met", "met_controls", "controls.met", "completed", "satisfied"]);
    let coverage = getNumberFromPaths(entry, [
      "coverage",
      "coverage_percentage",
      "completion",
      "completion_percentage",
      "progress",
      "score",
      "readiness"
    ]);
    if (coverage == null && total != null && met != null && total > 0) {
      coverage = Math.round((met / total) * 100);
    }
    return {
      id: getStringFromPaths(entry, ["id", "uuid", "framework_id", "code"]) || `framework-${index}`,
      name: getStringFromPaths(entry, ["name", "framework", "title", "code"]) || "Unnamed framework",
      coverage,
      status: getStringFromPaths(entry, ["status", "state", "stage"]),
      controlsTotal: total,
      controlsMet: met
    };
  });
}

export function normalizeObligations(value: unknown): NormalizedObligation[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "obligations"]).map((entry, index) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "obligation_id"]) || `obligation-${index}`,
    title: getStringFromPaths(entry, ["title", "name", "requirement", "description", "summary"]) || "Untitled obligation",
    status: getStringFromPaths(entry, ["status", "state", "stage"]),
    severity: severityFrom(getStringFromPaths(entry, ["severity", "priority", "risk_level", "criticality"])),
    framework: getStringFromPaths(entry, ["framework", "framework_name", "regulation", "category"]),
    dueDate: getDateFromPaths(entry, ["due_date", "dueDate", "deadline", "date"])
  }));
}

/** Build a prioritized action list from compliance gaps, falling back to high-severity risks. */
export function normalizePriorityActions(gaps: unknown, risks: unknown): PriorityAction[] {
  const fromGaps = normalizeList(gaps, ["", "data", "result", "items", "results", "gaps"]).map((entry, index) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "gap_id"]) || `gap-${index}`,
    title:
      getStringFromPaths(entry, ["title", "name", "control", "requirement", "summary", "description"]) ||
      "Compliance gap",
    description: getStringFromPaths(entry, ["recommendation", "action", "remediation", "details", "description"]),
    severity: severityFrom(getStringFromPaths(entry, ["severity", "priority", "risk_level", "impact"]))
  }));

  if (fromGaps.length > 0) return fromGaps;

  return normalizeList(risks, ["", "data", "result", "items", "results", "risks"])
    .map((entry, index) => ({
      id: getStringFromPaths(entry, ["id", "uuid", "risk_id"]) || `risk-${index}`,
      title: getStringFromPaths(entry, ["title", "name", "summary", "description"]) || "Open risk",
      description: getStringFromPaths(entry, ["recommendation", "mitigation", "details", "description"]),
      severity: severityFrom(getStringFromPaths(entry, ["severity", "priority", "risk_level", "impact"]))
    }))
    .filter((r) => r.severity === "critical" || r.severity === "high");
}

export function normalizeCertifications(value: unknown): UnknownRecord[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "certifications"]);
}

/**
 * Recent activity / governance events, normalized from the enterprise control-center feed
 * (and any other activity-shaped payloads). Reads only real fields; no synthetic events.
 */
export function normalizeComplianceActivity(...sources: unknown[]): ComplianceActivity[] {
  const records: UnknownRecord[] = [];
  for (const source of sources) {
    records.push(
      ...normalizeList(source, [
        "feed",
        "recent_activity",
        "activity",
        "activities",
        "events",
        "timeline",
        "history",
        "audit_log",
        "logs"
      ])
    );
  }
  return records.map((entry, index) => {
    const severityRaw = getStringFromPaths(entry, ["severity", "priority", "risk_level", "level"]);
    return {
      id: getStringFromPaths(entry, ["id", "uuid", "event_id", "activity_id"]) || `activity-${index}`,
      title: getStringFromPaths(entry, ["title", "name", "message", "summary", "action", "description"]) || "Activity",
      type: getStringFromPaths(entry, ["type", "event_type", "category", "action_type"]),
      timestamp: getDateFromPaths(entry, ["timestamp", "created_at", "updated_at", "event_time", "date", "occurred_at"]),
      status: getStringFromPaths(entry, ["status", "state", "outcome"]),
      severity: severityRaw ? severityFrom(severityRaw) : null
    };
  });
}
