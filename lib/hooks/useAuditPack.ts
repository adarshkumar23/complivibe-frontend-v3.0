"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAuditEngagements,
  getAuditEngagementsDashboard,
  getAuditFindingsSummary,
  getPbcItemsSummary,
  getAuditFindingsForEngagement,
  getPbcItemsForEngagement,
  createAuditEngagement,
  transitionAuditEngagement,
  createAuditFinding,
  transitionAuditFinding,
  createPbcItem,
  submitPbcItem,
  acceptPbcItem,
  rejectPbcItem,
  type AuditEngagementCreateInput,
  type AuditFindingCreateInput,
  type PbcItemCreateInput
} from "@/lib/api/audit-pack";

export function useAuditPack() {
  const engagements = useQuery({ queryKey: ["audit-engagements"], queryFn: () => getAuditEngagements() });
  const dashboard = useQuery({ queryKey: ["audit-engagements-dashboard"], queryFn: getAuditEngagementsDashboard });
  const findings = useQuery({ queryKey: ["audit-findings-summary"], queryFn: getAuditFindingsSummary });
  const pbc = useQuery({ queryKey: ["pbc-summary"], queryFn: getPbcItemsSummary });

  return { engagements, dashboard, findings, pbc };
}

export type AuditPackData = ReturnType<typeof useAuditPack>;

/** Findings scoped to one engagement (GET /audit-findings/engagement/{id}). */
export function useEngagementFindings(engagementId: string | null) {
  return useQuery({
    queryKey: ["audit-findings", engagementId],
    queryFn: () => getAuditFindingsForEngagement(engagementId as string),
    enabled: Boolean(engagementId)
  });
}

/** PBC items scoped to one engagement (GET /pbc-items/engagement/{id}). */
export function useEngagementPbcItems(engagementId: string | null) {
  return useQuery({
    queryKey: ["pbc-items", engagementId],
    queryFn: () => getPbcItemsForEngagement(engagementId as string),
    enabled: Boolean(engagementId)
  });
}

type QC = ReturnType<typeof useQueryClient>;

function invalidateEngagementQueries(queryClient: QC) {
  queryClient.invalidateQueries({ queryKey: ["audit-engagements"] });
  queryClient.invalidateQueries({ queryKey: ["audit-engagements-dashboard"] });
}

function invalidateFindingQueries(queryClient: QC, engagementId: string) {
  queryClient.invalidateQueries({ queryKey: ["audit-findings", engagementId] });
  queryClient.invalidateQueries({ queryKey: ["audit-findings-summary"] });
}

function invalidatePbcQueries(queryClient: QC, engagementId: string) {
  queryClient.invalidateQueries({ queryKey: ["pbc-items", engagementId] });
  queryClient.invalidateQueries({ queryKey: ["pbc-summary"] });
}

/** POST /compliance/audit-engagements — list + dashboard KPIs refresh without reload. */
export function useCreateEngagement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AuditEngagementCreateInput) => createAuditEngagement(body),
    onSuccess: () => invalidateEngagementQueries(queryClient)
  });
}

/** POST /compliance/audit-engagements/{id}/transition */
export function useTransitionEngagement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ engagementId, newStatus }: { engagementId: string; newStatus: string }) =>
      transitionAuditEngagement(engagementId, newStatus),
    onSuccess: () => invalidateEngagementQueries(queryClient)
  });
}

/** POST /compliance/audit-findings?engagement_id= */
export function useCreateFinding(engagementId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AuditFindingCreateInput) => createAuditFinding(engagementId, body),
    onSuccess: () => invalidateFindingQueries(queryClient, engagementId)
  });
}

/** POST /compliance/audit-findings/{id}/transition */
export function useTransitionFinding(engagementId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ findingId, newStatus }: { findingId: string; newStatus: string }) =>
      transitionAuditFinding(findingId, newStatus),
    onSuccess: () => invalidateFindingQueries(queryClient, engagementId)
  });
}

/** POST /compliance/pbc-items?engagement_id= */
export function useCreatePbcItem(engagementId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: PbcItemCreateInput) => createPbcItem(engagementId, body),
    onSuccess: () => invalidatePbcQueries(queryClient, engagementId)
  });
}

/** POST /compliance/pbc-items/{id}/submit|accept|reject */
export function usePbcAction(engagementId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      action,
      reason,
      evidenceId
    }: {
      itemId: string;
      action: "submit" | "accept" | "reject";
      /** reject: rejection_reason (required); accept: override_reason (needed when no evidence). */
      reason?: string;
      evidenceId?: string | null;
    }) => {
      if (action === "submit") return submitPbcItem(itemId, evidenceId);
      if (action === "accept") return acceptPbcItem(itemId, reason);
      return rejectPbcItem(itemId, reason ?? "");
    },
    onSuccess: () => invalidatePbcQueries(queryClient, engagementId)
  });
}
