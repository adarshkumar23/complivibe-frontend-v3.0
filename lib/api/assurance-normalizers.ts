import {
  getStringFromPaths,
  getNumberFromPaths,
  getDateFromPaths,
  normalizeList,
  getArrayFromPaths
} from "@/lib/api/normalizers";

/**
 * Assurance case, normalized from /api/v1/assurance-ext/cases (or /api/v1/assurance/reviews).
 * Every business field is null/absent unless the backend returns it — never fabricated.
 */
export type AssuranceCase = {
  id: string;
  rawId: string | null;
  title: string;
  type: string | null;
  linkedResource: string | null;
  reviewer: string | null;
  status: string | null;
  priority: string | null;
  dueDate: string | null;
  evidenceCount: number | null;
  findingsCount: number | null;
  signOffStatus: string | null;
};

const LIST_PATHS = ["", "data", "result", "items", "results", "data.items", "cases", "reviews", "assurance", "records"];

export function normalizeAssuranceCases(value: unknown): AssuranceCase[] {
  return normalizeList(value, LIST_PATHS).map((entry, index) => {
    const rawId = getStringFromPaths(entry, ["id", "uuid", "case_id", "review_id"]);
    return {
      id: rawId || `assurance-${index}`,
      rawId,
      title: getStringFromPaths(entry, ["title", "name", "subject", "case", "summary", "description"]) || "Untitled case",
      type: getStringFromPaths(entry, ["type", "case_type", "review_type", "category", "kind"]),
      linkedResource: getStringFromPaths(entry, ["resource", "linked_resource", "target", "object", "reference", "resource_name"]),
      reviewer: getStringFromPaths(entry, ["reviewer", "owner", "assignee", "assigned_to", "approver"]),
      status: getStringFromPaths(entry, ["status", "state", "review_status", "stage"]),
      priority: getStringFromPaths(entry, ["priority", "severity", "risk_level", "urgency"]),
      dueDate: getDateFromPaths(entry, ["due_date", "dueDate", "deadline", "review_by", "sla_due"]),
      evidenceCount: getNumberFromPaths(entry, ["evidence_count", "evidence", "evidence_items", "linked_evidence"]),
      findingsCount: getNumberFromPaths(entry, ["findings_count", "findings", "issues_count", "issues"]),
      signOffStatus: getStringFromPaths(entry, ["sign_off_status", "signoff_status", "sign_off", "signoff", "approval_status", "decision"])
    };
  });
}

const COMPLETE = ["complete", "completed", "signed off", "signed-off", "approved", "closed", "done", "passed"];
const AWAITING = ["await", "pending", "in review", "open", "submitted", "for sign", "ready for"];

function matches(value: string | null, words: string[]): boolean {
  if (!value) return false;
  const v = value.toLowerCase();
  return words.some((w) => v.includes(w));
}

export function isComplete(c: AssuranceCase): boolean {
  return matches(c.status, COMPLETE) || matches(c.signOffStatus, COMPLETE);
}
export function isAwaitingSignoff(c: AssuranceCase): boolean {
  if (isComplete(c)) return false;
  return matches(c.status, AWAITING) || matches(c.signOffStatus, AWAITING);
}

export function statusTone(status: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!status) return "neutral";
  const s = status.toLowerCase();
  if (/(rejected|failed|blocked|overdue)/.test(s)) return "bad";
  if (matches(status, COMPLETE)) return "good";
  if (matches(status, AWAITING) || /(progress|review)/.test(s)) return "warn";
  return "neutral";
}

export function priorityTone(priority: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!priority) return "neutral";
  const p = priority.toLowerCase();
  if (/(critical|high|urgent)/.test(p)) return "bad";
  if (/(medium|moderate)/.test(p)) return "warn";
  if (/(low|minor)/.test(p)) return "good";
  return "neutral";
}

/* ----------------------------- Summary ----------------------------- */
export type AssuranceSummary = {
  openCases: number | null;
  awaitingSignoff: number | null;
  completed: number | null;
  evidenceUnderReview: number | null;
  coverage: number | null;
  hasAny: boolean;
};

export function normalizeAssuranceSummary(value: unknown): AssuranceSummary {
  const openCases = getNumberFromPaths(value, ["open_cases", "open", "open_reviews", "in_progress"]);
  const awaitingSignoff = getNumberFromPaths(value, ["awaiting_signoff", "awaiting_sign_off", "pending_signoff", "awaiting"]);
  const completed = getNumberFromPaths(value, ["completed", "completed_reviews", "closed", "signed_off"]);
  const evidenceUnderReview = getNumberFromPaths(value, ["evidence_under_review", "evidence_in_review", "evidence_count"]);
  const coverage = getNumberFromPaths(value, ["coverage", "coverage_percentage", "completion", "completion_percentage"]);
  const hasAny = [openCases, awaitingSignoff, completed, evidenceUnderReview, coverage].some((v) => v != null);
  return { openCases, awaitingSignoff, completed, evidenceUnderReview, coverage, hasAny };
}

/* ----------------------------- Reviewer checklist ----------------------------- */
export type ChecklistItem = { label: string; status: string | null; done: boolean | null };

const CHECK_FIELDS: { label: string; paths: string[] }[] = [
  { label: "Evidence verified", paths: ["evidence_verified", "evidence_check", "evidence_reviewed"] },
  { label: "Risk reviewed", paths: ["risk_reviewed", "risk_check", "risk_review"] },
  { label: "Policy mapped", paths: ["policy_mapped", "policy_check", "policy_mapping"] },
  { label: "Report reviewed", paths: ["report_reviewed", "report_check"] },
  { label: "Questionnaire answer reviewed", paths: ["questionnaire_reviewed", "answers_reviewed", "questionnaire_check"] },
  { label: "Human sign-off completed", paths: ["human_signoff", "sign_off_completed", "human_sign_off", "signoff_completed"] }
];

function boolish(value: unknown, paths: string[]): boolean | null {
  const s = getStringFromPaths(value, paths);
  if (s == null) return null;
  return /^(true|1|yes|done|complete|completed|verified|passed|signed)/i.test(s.trim());
}

/** Reads checklist state from a case/summary payload. Each item appears only when the backend provides it. */
export function normalizeReviewerChecklist(value: unknown): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  for (const { label, paths } of CHECK_FIELDS) {
    const statusPaths = paths.map((p) => `${p}_status`);
    const status = getStringFromPaths(value, [...statusPaths, ...paths.map((p) => `${p}.status`)]);
    const done = boolish(value, paths);
    if (status != null || done != null) items.push({ label, status, done });
  }
  return items;
}

/* ----------------------------- Linked work ----------------------------- */
export type LinkedRecord = { id: string; title: string; kind: string; status: string | null };

/** Map a backend resource list into reviewable linked records. Reads real fields only. */
export function linkedRecords(value: unknown, kind: string, listExtra: string[] = []): LinkedRecord[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "data.items", ...listExtra]).map((entry, index) => ({
    id: getStringFromPaths(entry, ["id", "uuid"]) || `${kind}-${index}`,
    title: getStringFromPaths(entry, ["title", "name", "filename", "subject", "summary", "description"]) || `${kind} item`,
    kind,
    status: getStringFromPaths(entry, ["status", "state", "review_status", "freshness"])
  }));
}

/** True when a resource payload actually returned an array of records. */
export function hasRecords(value: unknown, listExtra: string[] = []): boolean {
  return getArrayFromPaths(value, ["", "data", "result", "items", "results", "data.items", ...listExtra]).length > 0;
}
