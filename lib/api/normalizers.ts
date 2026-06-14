import type {
  EvidenceSummary,
  NormalizedAlert,
  NormalizedDeadline,
  NormalizedEvent,
  NormalizedSystem,
  ScoreValue,
  Severity,
  UnknownRecord
} from "@/lib/api/types";

const ENVELOPE_KEYS = ["data", "result"];
const ARRAY_KEYS = ["items", "results", "rows", "alerts", "systems", "evidence", "deadlines", "events", "insights"];

function isRecord(value: unknown): value is UnknownRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function getPath(value: unknown, path: string): unknown {
  if (!path) {
    return value;
  }

  return path.split(".").reduce<unknown>((current, segment) => {
    if (Array.isArray(current)) {
      const index = Number(segment);
      return Number.isInteger(index) ? current[index] : undefined;
    }
    if (!isRecord(current)) {
      return undefined;
    }
    return current[segment];
  }, value);
}

function candidates(value: unknown, depth = 0): unknown[] {
  if (!isRecord(value) || depth > 3) {
    return [value];
  }

  const found: unknown[] = [value];
  for (const key of ENVELOPE_KEYS) {
    if (key in value) {
      found.push(...candidates(value[key], depth + 1));
    }
  }
  return found;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[%,$,\s]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (isRecord(value)) {
    for (const key of ["score", "value", "health_score", "healthScore", "readiness", "percentage", "count", "total"]) {
      const parsed = toNumber(value[key]);
      if (parsed !== null) {
        return parsed;
      }
    }
  }
  return null;
}

function toString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
}

export function getNumberFromPaths(value: unknown, paths: string[]): number | null {
  for (const path of paths) {
    for (const candidate of candidates(value)) {
      const parsed = toNumber(getPath(candidate, path));
      if (parsed !== null) {
        return parsed;
      }
    }
  }
  return null;
}

export function getStringFromPaths(value: unknown, paths: string[]): string | null {
  for (const path of paths) {
    for (const candidate of candidates(value)) {
      const parsed = toString(getPath(candidate, path));
      if (parsed !== null) {
        return parsed;
      }
    }
  }
  return null;
}

export function getArrayFromPaths(value: unknown, paths: string[]): unknown[] {
  for (const path of paths) {
    for (const candidate of candidates(value)) {
      const direct = getPath(candidate, path);
      if (Array.isArray(direct)) {
        return direct;
      }
      if (isRecord(direct)) {
        for (const key of ARRAY_KEYS) {
          if (Array.isArray(direct[key])) {
            return direct[key] as unknown[];
          }
        }
      }
    }
  }

  for (const candidate of candidates(value)) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
    if (isRecord(candidate)) {
      for (const key of ARRAY_KEYS) {
        if (Array.isArray(candidate[key])) {
          return candidate[key] as unknown[];
        }
      }
    }
  }

  return [];
}

/** Backend-provided total/count fields, checked before falling back to array length. */
const TOTAL_PATHS = [
  "total",
  "count",
  "total_count",
  "totalCount",
  "total_items",
  "totalItems",
  "pagination.total",
  "meta.total",
  "summary.total"
];

/** Return the first array found in the payload (envelope-aware), or null if none exists. */
function findArray(value: unknown): unknown[] | null {
  for (const candidate of candidates(value)) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
    if (isRecord(candidate)) {
      for (const key of ARRAY_KEYS) {
        if (Array.isArray(candidate[key])) {
          return candidate[key] as unknown[];
        }
      }
    }
  }
  return null;
}

/**
 * Derive a real record count from a successful endpoint payload.
 * - Array payload -> array length.
 * - Backend-provided total/count field -> that number (so limited lists still report the full size).
 * - Otherwise the length of the first embedded list.
 * Returns `null` when the payload carries data but no countable list/total (e.g. a config object),
 * so callers can show "Records available" without fabricating a number. Never defaults to 0.
 */
export function getCountFromPayload(value: unknown): number | null {
  if (value == null) return null;
  if (Array.isArray(value)) return value.length;

  const explicit = getNumberFromPaths(value, TOTAL_PATHS);
  if (explicit !== null && explicit >= 0) {
    return Math.round(explicit);
  }

  const arr = findArray(value);
  if (arr !== null) return arr.length;

  return null;
}

export function getDateFromPaths(value: unknown, paths: string[]): string | null {
  const raw = getStringFromPaths(value, paths);
  if (!raw) {
    return null;
  }

  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString();
  }

  const numeric = Number(raw);
  if (Number.isFinite(numeric)) {
    const date = new Date(numeric > 9999999999 ? numeric : numeric * 1000);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  return null;
}

export function normalizeScore(value: unknown, paths: string[]): ScoreValue {
  for (const path of paths) {
    const found = getNumberFromPaths(value, [path]);
    if (found !== null) {
      return { value: found, sourcePath: path || "root" };
    }
  }
  return { value: null, sourcePath: null };
}

export function normalizeList(value: unknown, paths: string[] = [""]): UnknownRecord[] {
  return getArrayFromPaths(value, paths).filter((item): item is UnknownRecord => isRecord(item));
}

function normalizeSeverity(value: string | null): Severity {
  const raw = (value || "").toLowerCase();
  if (raw.includes("critical")) return "critical";
  if (raw.includes("high")) return "high";
  if (raw.includes("medium") || raw.includes("moderate") || raw.includes("amber")) return "medium";
  if (raw.includes("low") || raw.includes("minor")) return "low";
  return "info";
}

export function normalizeAlerts(insights: unknown, predictive: unknown): NormalizedAlert[] {
  const records = [
    ...normalizeList(insights, ["", "data", "result", "items", "results", "insights", "alerts"]),
    ...normalizeList(predictive, ["", "data", "result", "items", "results", "alerts"])
  ];

  return records.map((entry, index) => {
    // Only treat genuine severity/priority fields as a real classification — never "type".
    const sevRaw = getStringFromPaths(entry, ["severity", "priority", "risk_level", "level"]);
    return {
      id: getStringFromPaths(entry, ["id", "uuid", "alert_id", "insight_id"]) || `alert-${index}`,
      severity: normalizeSeverity(sevRaw),
      hasSeverity: sevRaw != null,
      title: getStringFromPaths(entry, ["title", "name", "summary", "message"]) || "Untitled alert",
      description: getStringFromPaths(entry, ["description", "details", "reason", "body"]),
      timestamp: getDateFromPaths(entry, ["timestamp", "created_at", "updated_at", "event_time", "date"]),
      confidence: getNumberFromPaths(entry, ["confidence", "confidence_score", "probability", "score"])
    };
  });
}

export function normalizeSystems(value: unknown): NormalizedSystem[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "systems"]).map((entry, index) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "system_id"]) || `system-${index}`,
    name: getStringFromPaths(entry, ["name", "system_name", "title"]) || "Unnamed system",
    riskLevel: normalizeSeverity(getStringFromPaths(entry, ["risk_level", "riskLevel", "severity", "priority"])),
    score: getNumberFromPaths(entry, ["risk_score", "score", "health_score", "compliance_score"]),
    owner: getStringFromPaths(entry, ["owner", "owner_name", "team", "business_owner"]),
    useCase: getStringFromPaths(entry, ["use_case", "useCase", "purpose", "description"]),
    lifecycleStage: getStringFromPaths(entry, ["lifecycle_stage", "lifecycleStage", "stage", "status"])
  }));
}

export function normalizeEvidence(value: unknown): EvidenceSummary {
  const items = normalizeList(value, ["", "data", "result", "items", "results", "evidence"]);
  return {
    totalCount: Math.round(getNumberFromPaths(value, ["total", "count", "total_count", "evidence_count", "summary.total"]) ?? items.length),
    freshCount: getNumberFromPaths(value, ["fresh", "fresh_count", "summary.fresh", "freshness.fresh"]),
    staleCount: getNumberFromPaths(value, ["stale", "stale_count", "summary.stale", "freshness.stale"]),
    expiredCount: getNumberFromPaths(value, ["expired", "expired_count", "summary.expired", "freshness.expired"])
  };
}

function daysRemaining(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export function normalizeDeadlines(value: unknown): NormalizedDeadline[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "deadlines"]).map((entry, index) => {
    const dueDate = getDateFromPaths(entry, ["due_date", "dueDate", "deadline", "date"]);
    return {
      id: getStringFromPaths(entry, ["id", "uuid", "deadline_id"]) || `deadline-${index}`,
      title: getStringFromPaths(entry, ["title", "name", "framework", "description"]) || "Untitled deadline",
      dueDate,
      daysRemaining: dueDate ? daysRemaining(dueDate) : null,
      priority: getStringFromPaths(entry, ["priority", "severity", "risk_level", "status"])
    };
  });
}

export function normalizeEvents(value: unknown): NormalizedEvent[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "events"]).map((entry, index) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "event_id"]) || `event-${index}`,
    title: getStringFromPaths(entry, ["title", "name", "message", "summary"]) || "Untitled event",
    eventType: getStringFromPaths(entry, ["type", "event_type", "category"]) || "event",
    timestamp: getDateFromPaths(entry, ["timestamp", "created_at", "updated_at", "event_time", "date"])
  }));
}
