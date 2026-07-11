"use client";

import { useQuery } from "@tanstack/react-query";
import { getAiSignals, getAiSignalsSummary, getAiEventsSummary } from "@/lib/api/ai-systems";

export function useAiMonitoring() {
  const signals = useQuery({ queryKey: ["ai-signals"], queryFn: () => getAiSignals() });
  const summary = useQuery({ queryKey: ["ai-signals-summary"], queryFn: getAiSignalsSummary });
  const events = useQuery({ queryKey: ["ai-events-summary"], queryFn: getAiEventsSummary });

  return { signals, summary, events };
}

export type AiMonitoringData = ReturnType<typeof useAiMonitoring>;
