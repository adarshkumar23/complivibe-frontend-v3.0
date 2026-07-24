"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getExecutionApprovals,
  getReviewQueue,
  getPendingReviews,
  getApprovalEnvelopes,
  getExecutionApprovalsSummary,
  approveReview,
  rejectReview,
  approveEnvelope,
  rejectEnvelope,
  approveExecutionApproval,
  rejectExecutionApproval
} from "@/lib/api/approvals";

export function useApprovals() {
  const executionApprovals = useQuery({ queryKey: ["execution-approvals"], queryFn: getExecutionApprovals });
  const reviewQueue = useQuery({ queryKey: ["review-queue"], queryFn: getReviewQueue });
  const pendingReviews = useQuery({ queryKey: ["pending-reviews"], queryFn: getPendingReviews });
  const envelopes = useQuery({ queryKey: ["approval-envelopes"], queryFn: getApprovalEnvelopes });
  const summary = useQuery({ queryKey: ["autopilot-approvals"], queryFn: getExecutionApprovalsSummary });

  return { executionApprovals, reviewQueue, pendingReviews, envelopes, summary };
}

export type ApprovalsData = ReturnType<typeof useApprovals>;

function useInvalidateApprovals() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["review-queue"] });
    qc.invalidateQueries({ queryKey: ["pending-reviews"] });
    qc.invalidateQueries({ queryKey: ["approval-envelopes"] });
    qc.invalidateQueries({ queryKey: ["execution-approvals"] });
    qc.invalidateQueries({ queryKey: ["autopilot-approvals"] });
  };
}

export type ApprovalDecisionArgs = { id: string; decision: "approve" | "reject"; notes: string };

export function useReviewDecision() {
  const invalidate = useInvalidateApprovals();
  return useMutation({
    mutationFn: ({ id, decision, notes }: ApprovalDecisionArgs) =>
      decision === "approve" ? approveReview(id, notes || null) : rejectReview(id, notes),
    onSuccess: invalidate
  });
}
export function useEnvelopeDecision() {
  const invalidate = useInvalidateApprovals();
  return useMutation({
    mutationFn: ({ id, decision, notes }: ApprovalDecisionArgs) =>
      decision === "approve" ? approveEnvelope(id, notes || null) : rejectEnvelope(id, notes),
    onSuccess: invalidate
  });
}
export function useExecutionApprovalDecision() {
  const invalidate = useInvalidateApprovals();
  return useMutation({
    mutationFn: ({ id, decision, notes }: ApprovalDecisionArgs) =>
      decision === "approve" ? approveExecutionApproval(id, notes) : rejectExecutionApproval(id, notes),
    onSuccess: invalidate
  });
}
