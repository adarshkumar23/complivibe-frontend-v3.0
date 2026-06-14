import {
  getStringFromPaths,
  getDateFromPaths,
  normalizeList
} from "@/lib/api/normalizers";

/**
 * Regulatory deadline, normalized from /api/v1/regulatory-intelligence/deadlines.
 * Every business field is null/absent unless the backend actually returns it — never fabricated.
 */
export type RegulatoryDeadline = {
  id: string;
  title: string;
  framework: string | null;
  jurisdiction: string | null;
  dueDate: string | null;
  daysRemaining: number | null;
  priority: string | null;
  linkedObligation: string | null;
};

const DEADLINE_PATHS = ["", "data", "result", "items", "results", "deadlines", "data.items"];

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export function normalizeRegulatoryDeadlines(value: unknown): RegulatoryDeadline[] {
  return normalizeList(value, DEADLINE_PATHS).map((entry, index) => {
    const dueDate = getDateFromPaths(entry, ["due_date", "dueDate", "deadline", "date", "effective_date"]);
    return {
      id: getStringFromPaths(entry, ["id", "uuid", "deadline_id"]) || `deadline-${index}`,
      title: getStringFromPaths(entry, ["title", "name", "obligation", "requirement", "description", "summary"]) || "Untitled deadline",
      framework: getStringFromPaths(entry, ["framework", "framework_name", "regulation", "regulation_name", "standard"]),
      jurisdiction: getStringFromPaths(entry, ["jurisdiction", "region", "country", "geography", "location"]),
      dueDate,
      daysRemaining: dueDate ? daysUntil(dueDate) : null,
      priority: getStringFromPaths(entry, ["priority", "severity", "risk_level", "criticality", "importance"]),
      linkedObligation: getStringFromPaths(entry, ["obligation", "obligation_title", "linked_obligation", "control", "control_id", "requirement_id"])
    };
  });
}

/**
 * Obligation, normalized from /api/v1/obligations. Priority/status/owner/category/evidence are
 * raw backend strings, null when absent — never defaulted to a severity or "open" value.
 */
export type RegulatoryObligation = {
  id: string;
  title: string;
  framework: string | null;
  category: string | null;
  priority: string | null;
  status: string | null;
  owner: string | null;
  evidenceRef: string | null;
  dueDate: string | null;
};

const OBLIGATION_PATHS = ["", "data", "result", "items", "results", "obligations", "data.items"];

export function normalizeRegulatoryObligations(value: unknown): RegulatoryObligation[] {
  return normalizeList(value, OBLIGATION_PATHS).map((entry, index) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "obligation_id"]) || `obligation-${index}`,
    title: getStringFromPaths(entry, ["title", "name", "requirement", "description", "summary"]) || "Untitled obligation",
    framework: getStringFromPaths(entry, ["framework", "framework_name", "regulation", "standard"]),
    category: getStringFromPaths(entry, ["category", "domain", "topic", "control_family", "type"]),
    priority: getStringFromPaths(entry, ["priority", "severity", "risk_level", "criticality", "importance"]),
    status: getStringFromPaths(entry, ["status", "state", "stage", "compliance_status"]),
    owner: getStringFromPaths(entry, ["owner", "owner_name", "responsible", "assignee", "team"]),
    evidenceRef: getStringFromPaths(entry, ["evidence", "evidence_ref", "control", "control_id", "linked_control", "linked_evidence"]),
    dueDate: getDateFromPaths(entry, ["due_date", "dueDate", "deadline", "date"])
  }));
}

const HIGH_PRIORITY = ["critical", "high", "urgent", "severe", "major"];

/** True only when the backend gave a priority that is genuinely high/critical. */
export function isHighPriority(priority: string | null): boolean {
  if (!priority) return false;
  const p = priority.toLowerCase();
  return HIGH_PRIORITY.some((x) => p.includes(x));
}

export function priorityTone(priority: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!priority) return "neutral";
  const p = priority.toLowerCase();
  if (isHighPriority(priority)) return "bad";
  if (/(medium|moderate)/.test(p)) return "warn";
  if (/(low|minor)/.test(p)) return "good";
  return "neutral";
}
