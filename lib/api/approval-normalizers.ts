import {
  getStringFromPaths,
  getDateFromPaths,
  normalizeList
} from "@/lib/api/normalizers";

/**
 * Approval queue item, normalized from /api/v1/approvals (or /api/v1/approval-queue).
 * Every business field is null/absent unless the backend returns it — never fabricated.
 */
export type ApprovalItem = {
  id: string;
  rawId: string | null;
  title: string;
  type: string | null;
  requester: string | null;
  reviewer: string | null;
  status: string | null;
  priority: string | null;
  dueDate: string | null;
  linkedResource: string | null;
  createdAt: string | null;
  decisionDate: string | null;
  decision: string | null;
  comment: string | null;
};

const LIST_PATHS = ["", "data", "result", "items", "results", "data.items", "approvals", "queue", "approval_queue", "records"];

export function normalizeApprovals(value: unknown): ApprovalItem[] {
  return normalizeList(value, LIST_PATHS).map((entry, index) => {
    const rawId = getStringFromPaths(entry, ["id", "uuid", "approval_id", "request_id"]);
    return {
      id: rawId || `approval-${index}`,
      rawId,
      title: getStringFromPaths(entry, ["title", "name", "subject", "item", "summary", "description"]) || "Untitled approval",
      type: getStringFromPaths(entry, ["type", "item_type", "resource_type", "category", "kind", "object_type"]),
      requester: getStringFromPaths(entry, ["requester", "requested_by", "submitted_by", "created_by", "author"]),
      reviewer: getStringFromPaths(entry, ["reviewer", "approver", "assignee", "owner", "assigned_to"]),
      status: getStringFromPaths(entry, ["status", "state", "approval_status", "decision_status", "stage"]),
      priority: getStringFromPaths(entry, ["priority", "severity", "urgency", "risk_level"]),
      dueDate: getDateFromPaths(entry, ["due_date", "dueDate", "deadline", "sla_due", "review_by"]),
      linkedResource: getStringFromPaths(entry, ["resource", "linked_resource", "resource_name", "target", "object", "reference"]),
      createdAt: getDateFromPaths(entry, ["created_at", "createdAt", "requested_at", "submitted_at"]),
      decisionDate: getDateFromPaths(entry, ["decision_date", "decided_at", "approved_at", "rejected_at", "resolved_at"]),
      decision: getStringFromPaths(entry, ["decision", "outcome", "resolution"]),
      comment: getStringFromPaths(entry, ["comment", "decision_comment", "note", "notes", "reason"])
    };
  });
}

/* ---- status interpretation: classifies REAL backend strings, never supplies one ---- */
const APPROVED = ["approved", "accepted", "signed off", "signed-off", "cleared", "complete", "completed"];
const REJECTED = ["rejected", "denied", "declined"];
const CHANGES = ["changes", "needs changes", "revision", "rework", "returned", "more info"];
const PENDING = ["pending", "awaiting", "in review", "open", "submitted", "queued", "new", "to review"];

function matches(value: string | null, words: string[]): boolean {
  if (!value) return false;
  const v = value.toLowerCase();
  return words.some((w) => v.includes(w));
}

export function isApproved(a: ApprovalItem): boolean {
  return matches(a.status, APPROVED) || matches(a.decision, APPROVED);
}
export function isRejected(a: ApprovalItem): boolean {
  return matches(a.status, REJECTED) || matches(a.decision, REJECTED);
}
export function isChangesRequested(a: ApprovalItem): boolean {
  return matches(a.status, CHANGES) || matches(a.decision, CHANGES);
}
export function isPending(a: ApprovalItem): boolean {
  if (isApproved(a) || isRejected(a) || isChangesRequested(a)) return false;
  return matches(a.status, PENDING) || (a.status == null && a.decision == null && a.decisionDate == null);
}
/** Overdue only with a real due date in the past and no decision recorded. */
export function isOverdue(a: ApprovalItem): boolean {
  if (isApproved(a) || isRejected(a) || a.decisionDate) return false;
  if (!a.dueDate) return false;
  return new Date(a.dueDate).getTime() < Date.now();
}

export function statusTone(status: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!status) return "neutral";
  if (matches(status, REJECTED)) return "bad";
  if (matches(status, APPROVED)) return "good";
  if (matches(status, CHANGES) || matches(status, PENDING)) return "warn";
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

/* ---- decision history: real decided items only ---- */
export type ApprovalDecision = {
  id: string;
  title: string;
  reviewer: string | null;
  decision: string | null;
  comment: string | null;
  timestamp: string;
  linkedResource: string | null;
};

export function decisionHistory(items: ApprovalItem[]): ApprovalDecision[] {
  const out: ApprovalDecision[] = [];
  for (const a of items) {
    // Only items the backend marks as decided (a decision string or a decision date).
    if (!a.decision && !a.decisionDate) continue;
    const ts = a.decisionDate;
    if (!ts) continue;
    out.push({ id: a.id, title: a.title, reviewer: a.reviewer, decision: a.decision ?? a.status, comment: a.comment, timestamp: ts, linkedResource: a.linkedResource });
  }
  return out.sort((x, y) => new Date(y.timestamp).getTime() - new Date(x.timestamp).getTime());
}

/** Real status distribution for the workflow chart. Empty when no item carries a status. */
export type StatusBucket = { label: string; value: number; tone: "good" | "warn" | "bad" | "neutral" };

export function workflowDistribution(items: ApprovalItem[]): StatusBucket[] {
  if (!items.some((a) => a.status)) return [];
  const buckets: { label: string; test: (a: ApprovalItem) => boolean; tone: "good" | "warn" | "bad" | "neutral" }[] = [
    { label: "Pending", test: isPending, tone: "warn" },
    { label: "Changes requested", test: isChangesRequested, tone: "warn" },
    { label: "Approved", test: isApproved, tone: "good" },
    { label: "Rejected", test: isRejected, tone: "bad" }
  ];
  return buckets
    .map((b) => ({ label: b.label, value: items.filter((a) => a.status && b.test(a)).length, tone: b.tone }))
    .filter((b) => b.value > 0);
}
