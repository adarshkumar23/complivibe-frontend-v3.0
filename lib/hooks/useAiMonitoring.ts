"use client";

import { useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { getAiSystems, getAiGovernanceSummary, getReliabilityTelemetry, getCostTelemetry, getPredictiveAlerts } from "@/lib/api/ai-monitoring";
import { getIncidents } from "@/lib/api/incidents";
import { normalizeAiSystems } from "@/lib/api/ai-system-normalizers";
import type { Enrichment } from "@/lib/hooks/useAiTesting";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn });
}

export function useAiMonitoring() {
  const systems = useEndpoint("ai-systems", getAiSystems);
  const governance = useEndpoint("ai-governance-summary", getAiGovernanceSummary);
  const alerts = useEndpoint("predictive-alerts", getPredictiveAlerts);
  const incidents = useEndpoint("incidents", getIncidents);

  const list = useMemo(() => (systems.isSuccess ? normalizeAiSystems(systems.data) : []), [systems.isSuccess, systems.data]);
  const ids = useMemo(() => list.map((s) => s.rawId).filter((x): x is string => Boolean(x)), [list]);

  const reliabilityQueries = useQueries({
    queries: ids.map((id) => ({ queryKey: ["reliability", id], queryFn: () => getReliabilityTelemetry(id), retry: false, staleTime: 60_000 }))
  });
  const costQueries = useQueries({
    queries: ids.map((id) => ({ queryKey: ["cost", id], queryFn: () => getCostTelemetry(id), retry: false, staleTime: 60_000 }))
  });

  const reliabilityById = useMemo(() => {
    const m = new Map<string, Enrichment>();
    ids.forEach((id, i) => {
      const q = reliabilityQueries[i];
      if (q) m.set(id, { data: q.data, isLoading: q.isLoading, isError: q.isError, isSuccess: q.isSuccess });
    });
    return m;
  }, [ids, reliabilityQueries]);

  const costById = useMemo(() => {
    const m = new Map<string, Enrichment>();
    ids.forEach((id, i) => {
      const q = costQueries[i];
      if (q) m.set(id, { data: q.data, isLoading: q.isLoading, isError: q.isError, isSuccess: q.isSuccess });
    });
    return m;
  }, [ids, costQueries]);

  const telemetryLoading = ids.length > 0 && (reliabilityQueries.some((q) => q.isLoading) || costQueries.some((q) => q.isLoading));
  const anyReliability = reliabilityQueries.some((q) => q.isSuccess);

  return { systems, governance, alerts, incidents, list, ids, reliabilityById, costById, telemetryLoading, anyReliability };
}

export type AiMonitoringData = ReturnType<typeof useAiMonitoring>;
