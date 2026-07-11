"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getRisks,
  getRiskSummary,
  getRiskHeatmap,
  createRisk,
  updateRisk,
  type RiskCreatePayload,
  type RiskUpdatePayload
} from "@/lib/api/risks";
import { getOrgUsers } from "@/lib/api/users";

export function useRisks() {
  const risks = useQuery({ queryKey: ["risks"], queryFn: () => getRisks() });
  const summary = useQuery({ queryKey: ["risk-summary"], queryFn: getRiskSummary });
  const heatmap = useQuery({ queryKey: ["risk-heatmap"], queryFn: getRiskHeatmap });

  return { risks, summary, heatmap };
}

export type RisksData = ReturnType<typeof useRisks>;

/** Org members, for the risk-owner picker (GET /api/v1/users). */
export function useOrgUsers() {
  return useQuery({ queryKey: ["org-users"], queryFn: () => getOrgUsers() });
}

/** Refetch every risk-derived view so the register, KPIs, and matrix update without a reload. */
function invalidateRiskQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["risks"] });
  queryClient.invalidateQueries({ queryKey: ["risk-summary"] });
  queryClient.invalidateQueries({ queryKey: ["risk-heatmap"] });
}

/** POST /api/v1/risks */
export function useCreateRisk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RiskCreatePayload) => createRisk(payload),
    onSuccess: () => invalidateRiskQueries(queryClient)
  });
}

/** PATCH /api/v1/risks/{risk_id} — partial update, callers send only changed fields. */
export function useUpdateRisk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ riskId, payload }: { riskId: string; payload: RiskUpdatePayload }) =>
      updateRisk(riskId, payload),
    onSuccess: () => invalidateRiskQueries(queryClient)
  });
}
