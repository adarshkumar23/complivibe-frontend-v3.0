"use client";

import { useQuery } from "@tanstack/react-query";
import { getRisks, getRiskSummary, getRiskHeatmap } from "@/lib/api/risks";

export function useRisks() {
  const risks = useQuery({ queryKey: ["risks"], queryFn: () => getRisks() });
  const summary = useQuery({ queryKey: ["risk-summary"], queryFn: getRiskSummary });
  const heatmap = useQuery({ queryKey: ["risk-heatmap"], queryFn: getRiskHeatmap });

  return { risks, summary, heatmap };
}

export type RisksData = ReturnType<typeof useRisks>;
