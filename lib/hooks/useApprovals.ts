"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getExecutionApprovals,
  getReviewQueue,
  getApprovalEnvelopes,
  getExecutionApprovalsSummary
} from "@/lib/api/approvals";

export function useApprovals() {
  const executionApprovals = useQuery({ queryKey: ["execution-approvals"], queryFn: getExecutionApprovals });
  const reviewQueue = useQuery({ queryKey: ["review-queue"], queryFn: getReviewQueue });
  const envelopes = useQuery({ queryKey: ["approval-envelopes"], queryFn: getApprovalEnvelopes });
  const summary = useQuery({ queryKey: ["autopilot-approvals"], queryFn: getExecutionApprovalsSummary });

  return { executionApprovals, reviewQueue, envelopes, summary };
}

export type ApprovalsData = ReturnType<typeof useApprovals>;
