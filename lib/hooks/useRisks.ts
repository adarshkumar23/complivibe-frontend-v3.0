"use client";

import { useQuery } from "@tanstack/react-query";
import { getRisks } from "@/lib/api/risks";
import { getAiSystems } from "@/lib/api/ai-systems";
import { getComplianceEvidence, getComplianceGaps } from "@/lib/api/compliance";
import { getPredictiveAlerts, getScoresSummary } from "@/lib/api/command";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn });
}

export function useRisks() {
  const risks = useEndpoint("risks", getRisks);
  const aiSystems = useEndpoint("ai-systems", getAiSystems);
  const evidence = useEndpoint("cmp-evidence", getComplianceEvidence);
  const gaps = useEndpoint("cmp-gaps", getComplianceGaps);
  const predictive = useEndpoint("predictive-alerts", getPredictiveAlerts);
  const scores = useEndpoint("scores-summary", getScoresSummary);

  return { risks, aiSystems, evidence, gaps, predictive, scores };
}

export type RisksData = ReturnType<typeof useRisks>;
