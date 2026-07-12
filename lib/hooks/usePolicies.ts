"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPolicies,
  getPolicySummary,
  getPolicyTemplates,
  getPolicyVersions,
  getPolicyApprovalRequests,
  getCurrentUser,
  createPolicy,
  updatePolicy,
  archivePolicy,
  createPolicyVersion,
  submitVersionForApproval,
  createPolicyApprovalRequest,
  approvePolicyApprovalRequest,
  rejectPolicyApprovalRequest,
  cancelPolicyApprovalRequest,
  applyPolicyTemplate,
  type PolicyCreatePayload,
  type PolicyUpdatePayload,
  type PolicyVersionCreatePayload
} from "@/lib/api/policies";
import { getOrgUsers } from "@/lib/api/users";

export function usePolicies() {
  const policies = useQuery({ queryKey: ["policies"], queryFn: () => getPolicies() });
  const summary = useQuery({ queryKey: ["policy-summary"], queryFn: getPolicySummary });
  const templates = useQuery({ queryKey: ["policy-templates"], queryFn: () => getPolicyTemplates(20) });

  return { policies, summary, templates };
}

export type PoliciesData = ReturnType<typeof usePolicies>;

/** Org members for owner / approver pickers (GET /api/v1/users). */
export function usePolicyUsers() {
  return useQuery({ queryKey: ["org-users"], queryFn: () => getOrgUsers() });
}

/** GET /api/v1/auth/me — used to gate approve/reject actions to the right user. */
export function useCurrentUser() {
  return useQuery({ queryKey: ["current-user"], queryFn: getCurrentUser, staleTime: 300_000 });
}

/** Version history + approval requests for one policy (detail view). */
export function usePolicyDetail(policyId: string | null) {
  const versions = useQuery({
    queryKey: ["policy-versions", policyId],
    queryFn: () => getPolicyVersions(policyId as string),
    enabled: Boolean(policyId)
  });
  const approvals = useQuery({
    queryKey: ["policy-approvals", policyId],
    queryFn: () => getPolicyApprovalRequests(policyId as string),
    enabled: Boolean(policyId)
  });
  return { versions, approvals };
}

/** Refetch every policy-derived view so the library, KPIs, and detail update without a reload. */
function invalidatePolicyQueries(queryClient: ReturnType<typeof useQueryClient>, policyId?: string) {
  queryClient.invalidateQueries({ queryKey: ["policies"] });
  queryClient.invalidateQueries({ queryKey: ["policy-summary"] });
  if (policyId) {
    queryClient.invalidateQueries({ queryKey: ["policy-versions", policyId] });
    queryClient.invalidateQueries({ queryKey: ["policy-approvals", policyId] });
  }
}

/**
 * POST /api/v1/compliance/policies — optionally followed by
 * POST …/{id}/versions when initial content is supplied, so a blank-form
 * create can still produce a reviewable version 1.0 in one action.
 */
export function useCreatePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      payload,
      initialContent
    }: {
      payload: PolicyCreatePayload;
      initialContent?: string | null;
    }) => {
      const policy = await createPolicy(payload);
      if (initialContent && initialContent.trim()) {
        await createPolicyVersion(policy.id, {
          version_number: payload.version || "1.0",
          content_snapshot_json: { content: initialContent },
          change_summary: "Initial version"
        });
      }
      return policy;
    },
    onSuccess: (policy) => invalidatePolicyQueries(queryClient, policy.id)
  });
}

/** POST /api/v1/compliance/policy-templates/{template_id}/apply */
export function useApplyPolicyTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, overrideTitle }: { templateId: string; overrideTitle?: string | null }) =>
      applyPolicyTemplate(templateId, overrideTitle),
    onSuccess: (result) => invalidatePolicyQueries(queryClient, result.policy_id)
  });
}

/** PATCH /api/v1/compliance/policies/{policy_id} (incl. one-step status transitions). */
export function useUpdatePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ policyId, payload }: { policyId: string; payload: PolicyUpdatePayload }) =>
      updatePolicy(policyId, payload),
    onSuccess: (_r, vars) => invalidatePolicyQueries(queryClient, vars.policyId)
  });
}

/** POST /api/v1/compliance/policies/{policy_id}/archive — only valid from "deprecated". */
export function useArchivePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ policyId, reason }: { policyId: string; reason: string }) => archivePolicy(policyId, reason),
    onSuccess: (_r, vars) => invalidatePolicyQueries(queryClient, vars.policyId)
  });
}

/** POST /api/v1/compliance/policies/{policy_id}/versions */
export function useCreatePolicyVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ policyId, payload }: { policyId: string; payload: PolicyVersionCreatePayload }) =>
      createPolicyVersion(policyId, payload),
    onSuccess: (_r, vars) => invalidatePolicyQueries(queryClient, vars.policyId)
  });
}

/**
 * "Send for review" — chains the three real backend calls that make up the
 * review handoff:
 *   1. POST …/versions/{vid}/submit-for-approval   (version → submitted)
 *   2. POST …/approval-requests                    (pending, assigned approver)
 *   3. PATCH …/{policy_id} {status: under_review}  (policy draft → under_review)
 * Any failure surfaces the real backend error; completed earlier steps are
 * real, auditable backend actions and are not rolled back.
 */
export function useSubmitForReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      policyId,
      versionId,
      approverUserId,
      notes,
      policyStatus
    }: {
      policyId: string;
      versionId: string;
      approverUserId: string;
      notes?: string | null;
      /** Current policy status — the PATCH step only fires for draft policies. */
      policyStatus: string;
    }) => {
      const version = await submitVersionForApproval(policyId, versionId, notes);
      const request = await createPolicyApprovalRequest(policyId, {
        version_id: versionId,
        approver_user_id: approverUserId,
        notes: notes ?? null
      });
      if (policyStatus === "draft") {
        await updatePolicy(policyId, { status: "under_review" });
      }
      return { version, request };
    },
    onSuccess: (_r, vars) => invalidatePolicyQueries(queryClient, vars.policyId)
  });
}

/** POST …/approval-requests/{request_id}/approve — assigned approver only, never the requester. */
export function useApproveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      policyId,
      requestId,
      notes,
      reviewNotes
    }: {
      policyId: string;
      requestId: string;
      notes?: string | null;
      reviewNotes?: string | null;
    }) => approvePolicyApprovalRequest(policyId, requestId, { notes, review_notes: reviewNotes }),
    onSuccess: (_r, vars) => invalidatePolicyQueries(queryClient, vars.policyId)
  });
}

/** POST …/approval-requests/{request_id}/reject */
export function useRejectRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      policyId,
      requestId,
      notes,
      reviewNotes
    }: {
      policyId: string;
      requestId: string;
      notes?: string | null;
      reviewNotes?: string | null;
    }) => rejectPolicyApprovalRequest(policyId, requestId, { notes, review_notes: reviewNotes }),
    onSuccess: (_r, vars) => invalidatePolicyQueries(queryClient, vars.policyId)
  });
}

/** POST …/approval-requests/{request_id}/cancel (requires a reason). */
export function useCancelRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ policyId, requestId, reason }: { policyId: string; requestId: string; reason: string }) =>
      cancelPolicyApprovalRequest(policyId, requestId, reason),
    onSuccess: (_r, vars) => invalidatePolicyQueries(queryClient, vars.policyId)
  });
}
