"use client";

import { useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { getAiSystems, getAiGovernanceSummary, getTestingSummary } from "@/lib/api/ai-testing";
import { getRisks } from "@/lib/api/risks";
import { getIncidents } from "@/lib/api/incidents";
import { normalizeAiSystems } from "@/lib/api/ai-system-normalizers";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn });
}

/** Per-system query result, kept generic so components own the normalization. */
export type Enrichment = { data: unknown; isLoading: boolean; isError: boolean; isSuccess: boolean };

export function useAiTesting() {
  const systems = useEndpoint("ai-systems", getAiSystems);
  const governance = useEndpoint("ai-governance-summary", getAiGovernanceSummary);
  const risks = useEndpoint("risks", getRisks);
  const incidents = useEndpoint("incidents", getIncidents);

  const list = useMemo(() => (systems.isSuccess ? normalizeAiSystems(systems.data) : []), [systems.isSuccess, systems.data]);
  const ids = useMemo(() => list.map((s) => s.rawId).filter((x): x is string => Boolean(x)), [list]);

  const testingQueries = useQueries({
    queries: ids.map((id) => ({ queryKey: ["testing-summary", id], queryFn: () => getTestingSummary(id), retry: false, staleTime: 60_000 }))
  });

  const testingById = useMemo(() => {
    const m = new Map<string, Enrichment>();
    ids.forEach((id, i) => {
      const q = testingQueries[i];
      if (q) m.set(id, { data: q.data, isLoading: q.isLoading, isError: q.isError, isSuccess: q.isSuccess });
    });
    return m;
  }, [ids, testingQueries]);

  const testingLoading = ids.length > 0 && testingQueries.some((q) => q.isLoading);
  const anyTesting = testingQueries.some((q) => q.isSuccess);

  return { systems, governance, risks, incidents, list, ids, testingById, testingLoading, anyTesting };
}

export type AiTestingData = ReturnType<typeof useAiTesting>;
