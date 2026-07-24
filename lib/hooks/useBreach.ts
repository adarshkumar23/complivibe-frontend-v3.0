"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBreachNotifications,
  declareBreach,
  recordRegulatorNotification,
  recordSubjectNotification,
  closeBreach,
  type BreachCreateInput
} from "@/lib/api/breach";

const KEY = ["breach-notifications"];

export function useBreachNotifications() {
  return useQuery({ queryKey: KEY, queryFn: getBreachNotifications });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: KEY });
  // Declaring/advancing a breach can touch the underlying issue + commitments.
  qc.invalidateQueries({ queryKey: ["cmp-issues"] });
}

export function useDeclareBreach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, body }: { issueId: string; body: BreachCreateInput }) => declareBreach(issueId, body),
    onSuccess: () => invalidate(qc)
  });
}

export function useRecordRegulatorNotification() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (breachId: string) => recordRegulatorNotification(breachId), onSuccess: () => invalidate(qc) });
}

export function useRecordSubjectNotification() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (breachId: string) => recordSubjectNotification(breachId), onSuccess: () => invalidate(qc) });
}

export function useCloseBreach() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (breachId: string) => closeBreach(breachId), onSuccess: () => invalidate(qc) });
}
