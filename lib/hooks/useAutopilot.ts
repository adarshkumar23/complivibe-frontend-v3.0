"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  getAutopilotSummary,
  getExecutionIntentsSummary,
  getExecutionApprovalsSummary,
  getCandidateActionsSummary,
  getOverridesSummary
} from "@/lib/api/automation";
import {
  approveExecutionApproval,
  archiveAutopilotPolicy,
  archiveExecutionIntent,
  createAutopilotPolicy,
  createExecutionIntent,
  getActionTemplates,
  getAutopilotExecutions,
  getAutopilotPolicies,
  getExecutionApprovals,
  getExecutionIntents,
  getGovernanceSettings,
  patchGovernanceSettings,
  rejectExecutionApproval,
  requestExecutionApproval,
  reverseAutopilotExecution,
  setDefaultAutopilotPolicy,
  type AutopilotPolicyCreate,
  type CandidateActionInput
} from "@/lib/api/autopilot";

export function useAutopilot() {
  const summary = useQuery({ queryKey: ["autopilot-summary"], queryFn: getAutopilotSummary });
  const intents = useQuery({ queryKey: ["autopilot-intents-summary"], queryFn: getExecutionIntentsSummary });
  const approvals = useQuery({ queryKey: ["autopilot-approvals-summary"], queryFn: getExecutionApprovalsSummary });
  const candidates = useQuery({ queryKey: ["autopilot-candidates"], queryFn: getCandidateActionsSummary });
  const overrides = useQuery({ queryKey: ["gov-overrides"], queryFn: getOverridesSummary });

  return { summary, intents, approvals, candidates, overrides };
}

export type AutopilotData = ReturnType<typeof useAutopilot>;

// ── Pipeline record queries ──────────────────────────────────────────────────

export function useAutopilotPolicies() {
  return useQuery({ queryKey: ["autopilot-policies"], queryFn: getAutopilotPolicies });
}

export function useActionTemplates() {
  return useQuery({ queryKey: ["autopilot-action-templates"], queryFn: getActionTemplates, staleTime: 5 * 60_000 });
}

export function useExecutionIntents() {
  return useQuery({ queryKey: ["autopilot-intents"], queryFn: getExecutionIntents });
}

export function useExecutionApprovals() {
  return useQuery({ queryKey: ["autopilot-approvals"], queryFn: getExecutionApprovals });
}

export function useAutopilotExecutions() {
  return useQuery({ queryKey: ["autopilot-executions"], queryFn: getAutopilotExecutions });
}

export function useGovernanceSettings() {
  return useQuery({ queryKey: ["governance-settings"], queryFn: getGovernanceSettings });
}

// ── Mutation invalidation helpers ────────────────────────────────────────────
// Every pipeline mutation refreshes both the affected record list and the
// summary tiles so the page updates without a reload.

function invalidatePolicies(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ["autopilot-policies"] });
  qc.invalidateQueries({ queryKey: ["autopilot-summary"] });
}

function invalidatePipeline(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ["autopilot-intents"] });
  qc.invalidateQueries({ queryKey: ["autopilot-intents-summary"] });
  qc.invalidateQueries({ queryKey: ["autopilot-approvals"] });
  qc.invalidateQueries({ queryKey: ["autopilot-approvals-summary"] });
  qc.invalidateQueries({ queryKey: ["autopilot-executions"] });
  qc.invalidateQueries({ queryKey: ["autopilot-summary"] });
}

// ── Policy mutations ─────────────────────────────────────────────────────────

export function useCreatePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AutopilotPolicyCreate) => createAutopilotPolicy(payload),
    onSuccess: () => invalidatePolicies(qc)
  });
}

export function useSetDefaultPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (policyId: string) => setDefaultAutopilotPolicy(policyId),
    onSuccess: () => invalidatePolicies(qc)
  });
}

export function useArchivePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ policyId, reason }: { policyId: string; reason?: string }) =>
      archiveAutopilotPolicy(policyId, reason),
    onSuccess: () => invalidatePolicies(qc)
  });
}

// ── Intent mutations ─────────────────────────────────────────────────────────

export function useCreateIntent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (candidate: CandidateActionInput) =>
      createExecutionIntent({ source_type: "candidate_action", candidate_action_json: candidate }),
    onSuccess: () => invalidatePipeline(qc)
  });
}

export function useArchiveIntent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ intentId, reason }: { intentId: string; reason?: string }) =>
      archiveExecutionIntent(intentId, reason),
    onSuccess: () => invalidatePipeline(qc)
  });
}

export function useRequestApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ intentId, note }: { intentId: string; note?: string }) =>
      requestExecutionApproval(intentId, note),
    onSuccess: () => invalidatePipeline(qc)
  });
}

// ── Approval mutations ───────────────────────────────────────────────────────

export function useApproveApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ approvalId, reason }: { approvalId: string; reason?: string }) =>
      approveExecutionApproval(approvalId, reason),
    onSuccess: () => invalidatePipeline(qc)
  });
}

export function useRejectApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ approvalId, reason }: { approvalId: string; reason: string }) =>
      rejectExecutionApproval(approvalId, reason),
    onSuccess: () => invalidatePipeline(qc)
  });
}

// ── Execution mutations ──────────────────────────────────────────────────────

export function useReverseExecution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ executionId, reason }: { executionId: string; reason?: string }) =>
      reverseAutopilotExecution(executionId, reason),
    onSuccess: () => invalidatePipeline(qc)
  });
}

// ── Governance settings (auto-execute opt-in) ────────────────────────────────

export function useUpdateGovernanceSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: patchGovernanceSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["governance-settings"] });
      qc.invalidateQueries({ queryKey: ["autopilot-summary"] });
    }
  });
}
