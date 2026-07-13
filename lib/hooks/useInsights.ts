"use client";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAiSystems, type AiSystem } from "@/lib/api/ai-systems";
import {
  applyRecommendation,
  dismissRecommendation,
  generateSystemRecommendations,
  getComplianceInbox,
  listSystemRecommendations,
  type AiRiskRecommendation
} from "@/lib/api/insights";

export type RecommendationWithSystem = AiRiskRecommendation & {
  system: AiSystem | undefined;
};

/**
 * Proactive Insights = the compliance inbox (GET /inbox) plus every active AI
 * governance recommendation, fanned out across each registered AI system
 * (the backend only exposes recommendations per-system, not org-wide).
 */
export function useInsights() {
  const inbox = useQuery({ queryKey: ["compliance-inbox"], queryFn: () => getComplianceInbox(100) });
  const systems = useQuery({ queryKey: ["ai-systems"], queryFn: () => getAiSystems() });

  const systemIds = systems.data?.map((s) => s.id) ?? [];
  const recQueries = useQueries({
    queries: systemIds.map((id) => ({
      queryKey: ["ai-system-recommendations", id],
      queryFn: () => listSystemRecommendations(id),
      enabled: systems.isSuccess
    }))
  });

  const recommendationsLoading = systems.isLoading || (systems.isSuccess && recQueries.some((q) => q.isLoading));
  const recommendationsError = systems.isError || recQueries.some((q) => q.isError);

  const systemById = new Map((systems.data ?? []).map((s) => [s.id, s]));
  const recommendations: RecommendationWithSystem[] = recQueries
    .flatMap((q) => q.data ?? [])
    .map((rec) => ({ ...rec, system: systemById.get(rec.ai_system_id) }));

  return {
    inbox,
    systems,
    recommendations: {
      isLoading: recommendationsLoading,
      isError: recommendationsError,
      data: recommendations,
      refetch: () => {
        void systems.refetch();
        for (const q of recQueries) void q.refetch();
      }
    }
  };
}

const RECOMMENDATION_KEY_PREFIX = "ai-system-recommendations";

export function useApplyRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recId: string) => applyRecommendation(recId),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === RECOMMENDATION_KEY_PREFIX });
    }
  });
}

export function useDismissRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recId: string) => dismissRecommendation(recId),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === RECOMMENDATION_KEY_PREFIX });
    }
  });
}

export function useGenerateRecommendations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (systemId: string) => generateSystemRecommendations(systemId),
    onSuccess: (_data, systemId) => {
      queryClient.invalidateQueries({ queryKey: [RECOMMENDATION_KEY_PREFIX, systemId] });
    }
  });
}
