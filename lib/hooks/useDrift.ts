"use client";

import { useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { getAiSystems, getDriftTelemetry } from "@/lib/api/drift";
import { getRisks } from "@/lib/api/risks";
import { getIncidents } from "@/lib/api/incidents";
import { getPredictiveAlerts } from "@/lib/api/command";
import { normalizeAiSystems } from "@/lib/api/ai-system-normalizers";
import type { Enrichment } from "@/lib/hooks/useAiTesting";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn });
}

export function useDrift() {
  const systems = useEndpoint("ai-systems", getAiSystems);
  const risks = useEndpoint("risks", getRisks);
  const incidents = useEndpoint("incidents", getIncidents);
  const alerts = useEndpoint("predictive-alerts", getPredictiveAlerts);

  const list = useMemo(() => (systems.isSuccess ? normalizeAiSystems(systems.data) : []), [systems.isSuccess, systems.data]);
  const ids = useMemo(() => list.map((s) => s.rawId).filter((x): x is string => Boolean(x)), [list]);

  const driftQueries = useQueries({
    queries: ids.map((id) => ({ queryKey: ["drift", id], queryFn: () => getDriftTelemetry(id), retry: false, staleTime: 60_000 }))
  });

  const driftById = useMemo(() => {
    const m = new Map<string, Enrichment>();
    ids.forEach((id, i) => {
      const q = driftQueries[i];
      if (q) m.set(id, { data: q.data, isLoading: q.isLoading, isError: q.isError, isSuccess: q.isSuccess });
    });
    return m;
  }, [ids, driftQueries]);

  const driftLoading = ids.length > 0 && driftQueries.some((q) => q.isLoading);
  const anyDrift = driftQueries.some((q) => q.isSuccess);

  return { systems, risks, incidents, alerts, list, ids, driftById, driftLoading, anyDrift };
}

export type DriftData = ReturnType<typeof useDrift>;
