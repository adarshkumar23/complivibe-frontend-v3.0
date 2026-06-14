import {
  getStringFromPaths,
  getDateFromPaths,
  getArrayFromPaths,
  normalizeList
} from "@/lib/api/normalizers";

/**
 * Workflow, normalized from /api/v1/workflows.
 * Every business field is null/absent unless the backend returns it — never fabricated.
 */
export type Workflow = {
  id: string;
  rawId: string | null;
  name: string;
  type: string | null;
  status: string | null;
  currentStage: string | null;
  owner: string | null;
  reviewer: string | null;
  dueDate: string | null;
  linkedResource: string | null;
  createdAt: string | null;
  completedAt: string | null;
  blocked: boolean | null;
  stages: WorkflowStage[];
};

export type WorkflowStage = { name: string; status: string | null; timestamp: string | null };

const LIST_PATHS = ["", "data", "result", "items", "results", "data.items", "workflows", "records"];

function normalizeStages(entry: unknown): WorkflowStage[] {
  return normalizeList(entry, ["stages", "steps", "timeline", "history", "stage_history"]).map((s, i) => ({
    name: getStringFromPaths(s, ["name", "stage", "step", "title", "label"]) || `Stage ${i + 1}`,
    status: getStringFromPaths(s, ["status", "state", "result"]),
    timestamp: getDateFromPaths(s, ["timestamp", "completed_at", "updated_at", "date", "at"])
  }));
}

function boolish(value: unknown, paths: string[]): boolean | null {
  const s = getStringFromPaths(value, paths);
  if (s == null) return null;
  return /^(true|1|yes|blocked|on)$/i.test(s.trim());
}

export function normalizeWorkflows(value: unknown): Workflow[] {
  return normalizeList(value, LIST_PATHS).map((entry, index) => {
    const rawId = getStringFromPaths(entry, ["id", "uuid", "workflow_id"]);
    return {
      id: rawId || `workflow-${index}`,
      rawId,
      name: getStringFromPaths(entry, ["name", "title", "workflow_name", "subject", "description"]) || "Untitled workflow",
      type: getStringFromPaths(entry, ["type", "workflow_type", "category", "kind"]),
      status: getStringFromPaths(entry, ["status", "state", "stage_status"]),
      currentStage: getStringFromPaths(entry, ["current_stage", "stage", "step", "phase", "current_step"]),
      owner: getStringFromPaths(entry, ["owner", "created_by", "owner_name", "assignee"]),
      reviewer: getStringFromPaths(entry, ["reviewer", "approver", "assigned_to"]),
      dueDate: getDateFromPaths(entry, ["due_date", "dueDate", "deadline", "sla_due", "review_by"]),
      linkedResource: getStringFromPaths(entry, ["resource", "linked_resource", "target", "object", "reference"]),
      createdAt: getDateFromPaths(entry, ["created_at", "createdAt", "started_at", "initiated_at"]),
      completedAt: getDateFromPaths(entry, ["completed_at", "finished_at", "closed_at", "resolved_at"]),
      blocked: boolish(entry, ["blocked", "is_blocked", "on_hold"]),
      stages: normalizeStages(entry)
    };
  });
}

const COMPLETE = ["complete", "completed", "done", "closed", "approved", "published", "exported", "signed"];
const BLOCKED = ["blocked", "failed", "error", "rejected", "on hold", "stuck"];
const REVIEW = ["review", "awaiting", "pending", "in progress", "changes requested", "submitted"];

function matches(value: string | null, words: string[]): boolean {
  if (!value) return false;
  const v = value.toLowerCase();
  return words.some((w) => v.includes(w));
}

export function isComplete(w: Workflow): boolean {
  return matches(w.status, COMPLETE) || Boolean(w.completedAt && !w.status);
}
export function isBlocked(w: Workflow): boolean {
  if (w.blocked === true) return true;
  return matches(w.status, BLOCKED);
}
export function isAwaitingReview(w: Workflow): boolean {
  if (isComplete(w) || isBlocked(w)) return false;
  return matches(w.status, REVIEW) || matches(w.currentStage, REVIEW);
}
export function isActiveWorkflow(w: Workflow): boolean {
  return !isComplete(w);
}
/** Overdue only with a real due date in the past and not complete. */
export function isOverdue(w: Workflow): boolean {
  if (isComplete(w)) return false;
  if (!w.dueDate) return false;
  return new Date(w.dueDate).getTime() < Date.now();
}

export function statusTone(status: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!status) return "neutral";
  if (matches(status, BLOCKED)) return "bad";
  if (matches(status, COMPLETE)) return "good";
  if (matches(status, REVIEW)) return "warn";
  return "neutral";
}

export function stageTone(status: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!status) return "neutral";
  const s = status.toLowerCase();
  if (/(reject|fail|blocked|error)/.test(s)) return "bad";
  if (/(done|complete|approved|passed|signed|published|exported|current)/.test(s)) return "good";
  if (/(progress|pending|review|active|changes)/.test(s)) return "warn";
  return "neutral";
}

/** True when a resource payload actually returned an array of records. */
export function hasRecords(value: unknown, listExtra: string[] = []): boolean {
  return getArrayFromPaths(value, ["", "data", "result", "items", "results", "data.items", ...listExtra]).length > 0;
}
