import { apiFetch } from "@/lib/api/client";

/**
 * Approvals API — the backend has no global approvals endpoint; approvals are
 * per-entity. This aggregates the real queues:
 * autopilot execution approvals, AI governance review queue, approval envelopes.
 */

export type ExecutionApproval = {
  id: string;
  status?: string | null;
  intent_id?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

export function getExecutionApprovals() {
  return apiFetch<ExecutionApproval[]>("/api/v1/ai-governance/autopilot/execution-approvals");
}

export type ReviewQueueItem = {
  id?: string;
  ai_system_id?: string | null;
  review_type?: string | null;
  due_at?: string | null;
  status?: string | null;
  [key: string]: unknown;
};

export function getReviewQueue() {
  return apiFetch<ReviewQueueItem[]>("/api/v1/ai-governance/review-queue");
}

export type ApprovalEnvelope = {
  id?: string;
  status?: string | null;
  entity_type?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

export function getApprovalEnvelopes() {
  return apiFetch<ApprovalEnvelope[]>("/api/v1/ai-governance/approval-envelopes");
}

export { getExecutionApprovalsSummary } from "@/lib/api/automation";
