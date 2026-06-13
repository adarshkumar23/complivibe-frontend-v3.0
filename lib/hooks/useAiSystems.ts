"use client";

import { useQuery } from "@tanstack/react-query";
import { getAiSystems, getAiGovernanceSummary, getGovernanceScore } from "@/lib/api/ai-systems";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn });
}

export function useAiSystems() {
  const systems = useEndpoint("ai-systems", getAiSystems);
  const governanceSummary = useEndpoint("ai-governance-summary", getAiGovernanceSummary);
  const governanceScore = useEndpoint("governance-score", getGovernanceScore);

  return { systems, governanceSummary, governanceScore };
}

export type AiSystemsData = ReturnType<typeof useAiSystems>;
