"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPolicyExceptions,
  createPolicyException,
  approvePolicyException,
  rejectPolicyException,
  type PolicyExceptionCreatePayload
} from "@/lib/api/policy-exceptions";
import { getPolicies } from "@/lib/api/policies";
import { getOrgUsers } from "@/lib/api/users";

/** GET /api/v1/compliance/policy-exceptions (plain array). */
export function usePolicyExceptions() {
  return useQuery({ queryKey: ["policy-exceptions"], queryFn: () => getPolicyExceptions() });
}

/** Policies, for the create modal's policy picker. */
export function usePolicyPicker() {
  return useQuery({ queryKey: ["policies"], queryFn: () => getPolicies() });
}

/** Org members, to map requester/approver/rejecter ids → names. */
export function useExceptionUsers() {
  return useQuery({ queryKey: ["org-users"], queryFn: () => getOrgUsers() });
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["policy-exceptions"] });
}

/** POST /api/v1/compliance/policy-exceptions — request an exception. */
export function useCreatePolicyException() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PolicyExceptionCreatePayload) => createPolicyException(payload),
    onSuccess: () => invalidate(queryClient)
  });
}

/** POST …/{id}/approve — assigned reviewer only, never the requester (four-eyes). */
export function useApprovePolicyException() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ exceptionId, expiryDate }: { exceptionId: string; expiryDate: string }) =>
      approvePolicyException(exceptionId, expiryDate),
    onSuccess: () => invalidate(queryClient)
  });
}

/** POST …/{id}/reject — assigned reviewer only, never the requester (four-eyes). */
export function useRejectPolicyException() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ exceptionId }: { exceptionId: string }) => rejectPolicyException(exceptionId),
    onSuccess: () => invalidate(queryClient)
  });
}
