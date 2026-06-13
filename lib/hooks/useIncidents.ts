"use client";

import { useQuery } from "@tanstack/react-query";
import { getIncidents } from "@/lib/api/incidents";
import { getRisks } from "@/lib/api/risks";
import { getAiSystems } from "@/lib/api/ai-systems";
import { getComplianceEvidence } from "@/lib/api/compliance";
import { getPredictiveAlerts, getScoresSummary } from "@/lib/api/command";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn });
}

export function useIncidents() {
  const incidents = useEndpoint("incidents", getIncidents);
  const risks = useEndpoint("risks", getRisks);
  const aiSystems = useEndpoint("ai-systems", getAiSystems);
  const evidence = useEndpoint("cmp-evidence", getComplianceEvidence);
  const predictive = useEndpoint("predictive-alerts", getPredictiveAlerts);
  const scores = useEndpoint("scores-summary", getScoresSummary);

  return { incidents, risks, aiSystems, evidence, predictive, scores };
}

export type IncidentsData = ReturnType<typeof useIncidents>;
