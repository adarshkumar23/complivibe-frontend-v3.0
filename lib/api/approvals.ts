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

// AI governance reviews (the approvable entity — /reviews/{id}/approve|reject, four-eyes).
// Distinct from the review-QUEUE above, which is the governance review SCHEDULE.
export type AiReview = {
  id: string;
  ai_system_id?: string | null;
  review_type?: string | null;
  status?: string | null;
  assigned_reviewer_id?: string | null;
  created_by?: string | null;
  [key: string]: unknown;
};

// Reviews in "in_review" are the ones ready for an approve/reject decision (their
// criteria have been answered). "pending" reviews still need the criteria step in the
// review detail flow before they can be decided, so they're not shown here.
export function getPendingReviews() {
  return apiFetch<AiReview[]>("/api/v1/ai-governance/reviews?status=in_review");
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

// ════════════════ APPROVE / REJECT (per queue) ════════════════
// Reviews + envelopes: ai_governance:approve. Execution approvals: ai_systems:write.
// Reviews enforce four-eyes (a reviewer cannot approve their own review -> 422).

// AI reviews (review queue)
export function approveReview(reviewId: string, decisionNotes?: string | null) {
  return apiFetch(`/api/v1/ai-governance/reviews/${reviewId}/approve`, { method: "POST", body: JSON.stringify({ decision_notes: decisionNotes ?? null }) });
}
export function rejectReview(reviewId: string, decisionNotes: string) {
  return apiFetch(`/api/v1/ai-governance/reviews/${reviewId}/reject`, { method: "POST", body: JSON.stringify({ decision_notes: decisionNotes }) });
}

// Approval envelopes
export function approveEnvelope(envelopeId: string, notes?: string | null) {
  return apiFetch(`/api/v1/ai-governance/approval-envelopes/${envelopeId}/approve`, { method: "POST", body: JSON.stringify({ notes: notes ?? null }) });
}
export function rejectEnvelope(envelopeId: string, notes: string) {
  return apiFetch(`/api/v1/ai-governance/approval-envelopes/${envelopeId}/reject`, { method: "POST", body: JSON.stringify({ notes }) });
}

// Autopilot execution approvals
export function approveExecutionApproval(approvalId: string, decisionReason: string) {
  return apiFetch(`/api/v1/ai-governance/autopilot/execution-approvals/${approvalId}/approve`, { method: "POST", body: JSON.stringify({ decision_reason: decisionReason }) });
}
export function rejectExecutionApproval(approvalId: string, decisionReason: string) {
  return apiFetch(`/api/v1/ai-governance/autopilot/execution-approvals/${approvalId}/reject`, { method: "POST", body: JSON.stringify({ decision_reason: decisionReason }) });
}
