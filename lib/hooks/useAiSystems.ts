"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAiSystems,
  getAiSystemsSummary,
  getAiGovernanceDashboard,
  getAiGovernanceScorecard,
  createAiSystem,
  updateAiSystem,
  type AiSystemCreate,
  type AiSystemUpdate
} from "@/lib/api/ai-systems";

export function useAiSystems() {
  const systems = useQuery({ queryKey: ["ai-systems"], queryFn: () => getAiSystems() });
  const summary = useQuery({ queryKey: ["ai-systems-summary"], queryFn: getAiSystemsSummary });
  const dashboard = useQuery({ queryKey: ["ai-gov-dashboard"], queryFn: getAiGovernanceDashboard });
  const scorecard = useQuery({ queryKey: ["ai-gov-scorecard"], queryFn: getAiGovernanceScorecard });

  return { systems, summary, dashboard, scorecard };
}

export type AiSystemsData = ReturnType<typeof useAiSystems>;

/** Query keys touched by AI-system mutations, so lists/KPIs refresh without a reload. */
const AI_SYSTEM_KEYS = [["ai-systems"], ["ai-systems-summary"], ["ai-gov-dashboard"], ["ai-gov-scorecard"]];

export function useCreateAiSystem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AiSystemCreate) => createAiSystem(body),
    onSuccess: () => {
      for (const key of AI_SYSTEM_KEYS) queryClient.invalidateQueries({ queryKey: key });
    }
  });
}

export function useUpdateAiSystem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: AiSystemUpdate }) => updateAiSystem(id, body),
    onSuccess: (_data, { id }) => {
      for (const key of AI_SYSTEM_KEYS) queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: ["ai-system", id] });
    }
  });
}
