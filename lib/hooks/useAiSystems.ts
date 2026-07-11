"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAiSystems,
  getAiSystemsSummary,
  getAiGovernanceDashboard,
  getAiGovernanceScorecard
} from "@/lib/api/ai-systems";

export function useAiSystems() {
  const systems = useQuery({ queryKey: ["ai-systems"], queryFn: () => getAiSystems() });
  const summary = useQuery({ queryKey: ["ai-systems-summary"], queryFn: getAiSystemsSummary });
  const dashboard = useQuery({ queryKey: ["ai-gov-dashboard"], queryFn: getAiGovernanceDashboard });
  const scorecard = useQuery({ queryKey: ["ai-gov-scorecard"], queryFn: getAiGovernanceScorecard });

  return { systems, summary, dashboard, scorecard };
}

export type AiSystemsData = ReturnType<typeof useAiSystems>;
