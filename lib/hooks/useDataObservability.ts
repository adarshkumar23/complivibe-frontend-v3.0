"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getDataObsOverview,
  getDataObsSources,
  getDataObsPipelines,
  getDataObsQuality,
  getDataObsFreshness,
  getDataObsSensitive,
  getDataObsRag,
  getDataObsCatalog
} from "@/lib/api/data-observability";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn });
}

export function useDataObservability() {
  const overview = useEndpoint("dataobs-overview", getDataObsOverview);
  const sources = useEndpoint("dataobs-sources", getDataObsSources);
  const pipelines = useEndpoint("dataobs-pipelines", getDataObsPipelines);
  const quality = useEndpoint("dataobs-quality", getDataObsQuality);
  const freshness = useEndpoint("dataobs-freshness", getDataObsFreshness);
  const sensitive = useEndpoint("dataobs-sensitive", getDataObsSensitive);
  const rag = useEndpoint("dataobs-rag", getDataObsRag);
  const catalog = useEndpoint("dataobs-catalog", getDataObsCatalog);

  return { overview, sources, pipelines, quality, freshness, sensitive, rag, catalog };
}

export type DataObservability = ReturnType<typeof useDataObservability>;
