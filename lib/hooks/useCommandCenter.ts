"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getScoresSummary,
  getUnifiedHealthScore,
  getExecutiveSummary,
  getProactiveInsights,
  getPredictiveAlerts,
  getAiSystems,
  getEvidence,
  getRegulatoryDeadlines
} from "@/lib/api/command";
import { getNumberFromPaths } from "@/lib/api/normalizers";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn });
}

/** Try a set of candidate field paths across multiple payloads; first real number wins. */
export function pickScore(sources: unknown[], paths: string[]): number | null {
  for (const src of sources) {
    if (src == null) continue;
    const value = getNumberFromPaths(src, paths);
    if (value !== null) return value;
  }
  return null;
}

export function useCommandCenter() {
  const scores = useEndpoint("scores-summary", getScoresSummary);
  const unified = useEndpoint("unified-health", getUnifiedHealthScore);
  const executive = useEndpoint("executive-summary", getExecutiveSummary);
  const insights = useEndpoint("proactive-insights", getProactiveInsights);
  const predictive = useEndpoint("predictive-alerts", getPredictiveAlerts);
  const aiSystems = useEndpoint("ai-systems", getAiSystems);
  const evidence = useEndpoint("evidence", getEvidence);
  const deadlines = useEndpoint("regulatory-deadlines", getRegulatoryDeadlines);

  return { scores, unified, executive, insights, predictive, aiSystems, evidence, deadlines };
}

export type CommandCenter = ReturnType<typeof useCommandCenter>;
