"use client";

import { useMemo } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getAiSystems } from "@/lib/api/ai-systems";
import { getComplianceEvidence, getRisks } from "@/lib/api/compliance";
import { getIncidents } from "@/lib/api/incidents";
import { getReports } from "@/lib/api/reports";
import { getIntegrations } from "@/lib/api/integrations";
import { getDataObsSources, getDataObsPipelines, getDataObsSensitive } from "@/lib/api/data-observability";
import { getLineageGraph, getDataObsQualityIssues } from "@/lib/api/lineage";
import {
  normalizeLineageGraph,
  deriveLineageGraph,
  countBrokenLinks,
  lineageTableRows,
  normalizeSensitiveFindings,
  normalizeQualityIssues,
  type LineageGraph
} from "@/lib/api/lineage-normalizers";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>, retry: boolean | number = 1) {
  return useQuery({ queryKey: [key], queryFn: fn, retry, staleTime: 300_000 });
}

export type SourceStatus = {
  id: string;
  label: string;
  status: "loading" | "available" | "unavailable";
};

function statusOf(q: UseQueryResult<unknown>): SourceStatus["status"] {
  if (q.isLoading || q.isPending) return "loading";
  if (q.isError) return "unavailable";
  return "available";
}

export type DataLineage = {
  graph: LineageGraph;
  tableRows: ReturnType<typeof lineageTableRows>;
  sensitiveFindings: ReturnType<typeof normalizeSensitiveFindings>;
  qualityIssues: ReturnType<typeof normalizeQualityIssues>;
  kpis: {
    nodes: number;
    edges: number;
    sensitiveSignals: number;
    brokenLinks: number;
  };
  sourceStatuses: SourceStatus[];
  /** the lineage graph came from a real backend lineage endpoint (vs derived from records) */
  fromBackendGraph: boolean;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  /** sensitive endpoint specifically unavailable */
  sensitiveUnavailable: boolean;
  qualityUnavailable: boolean;
  refetch: () => void;
};

export function useDataLineage(): DataLineage {
  const lineage = useEndpoint("lineage-graph", getLineageGraph, false);
  const aiSystems = useEndpoint("ai-systems", getAiSystems);
  const evidence = useEndpoint("cmp-evidence", getComplianceEvidence);
  const risks = useEndpoint("risks", getRisks);
  const incidents = useEndpoint("incidents", getIncidents);
  const reports = useEndpoint("reports", getReports);
  const integrations = useEndpoint("integrations", getIntegrations);
  const sources = useEndpoint("dataobs-sources", getDataObsSources);
  const pipelines = useEndpoint("dataobs-pipelines", getDataObsPipelines);
  const sensitive = useEndpoint("dataobs-sensitive", getDataObsSensitive);
  const qualityIssuesQ = useEndpoint("dataobs-quality-issues", getDataObsQualityIssues, false);

  return useMemo<DataLineage>(() => {
    // Prefer a real backend lineage graph; otherwise derive only from real cross-module references.
    const backendGraph = !lineage.isError && lineage.data != null ? normalizeLineageGraph(lineage.data) : null;
    const fromBackendGraph = !!backendGraph && backendGraph.nodes.length > 0;

    const graph: LineageGraph = fromBackendGraph
      ? (backendGraph as LineageGraph)
      : deriveLineageGraph({
          aiSystems: aiSystems.data,
          sources: sources.data,
          pipelines: pipelines.data,
          evidence: evidence.data,
          risks: risks.data,
          incidents: incidents.data,
          reports: reports.data,
          integrations: integrations.data,
          sensitive: sensitive.data
        });

    const sensitiveFindings = sensitive.isError ? [] : normalizeSensitiveFindings(sensitive.data);
    const qualityIssues = qualityIssuesQ.isError ? [] : normalizeQualityIssues(qualityIssuesQ.data);

    const recordQueries: { id: string; label: string; q: UseQueryResult<unknown> }[] = [
      { id: "lineage", label: "Lineage graph", q: lineage },
      { id: "ai-systems", label: "AI systems", q: aiSystems },
      { id: "evidence", label: "Evidence", q: evidence },
      { id: "risks", label: "Risks", q: risks },
      { id: "incidents", label: "Incidents", q: incidents },
      { id: "reports", label: "Reports", q: reports },
      { id: "integrations", label: "Integrations", q: integrations },
      { id: "sources", label: "Data sources", q: sources },
      { id: "pipelines", label: "Pipelines", q: pipelines },
      { id: "sensitive", label: "Sensitive data", q: sensitive },
      { id: "quality", label: "Quality issues", q: qualityIssuesQ }
    ];

    const sourceStatuses: SourceStatus[] = recordQueries.map((r) => ({
      id: r.id,
      label: r.label,
      status: statusOf(r.q)
    }));

    // record sources used for derivation (exclude the optional lineage/quality probes)
    const derivationQueries = recordQueries.filter((r) => !["lineage", "quality"].includes(r.id));
    const isLoading = derivationQueries.some((r) => r.q.isLoading || r.q.isPending);
    const isError = derivationQueries.every((r) => r.q.isError);

    return {
      graph,
      tableRows: lineageTableRows(graph),
      sensitiveFindings,
      qualityIssues,
      kpis: {
        nodes: graph.nodes.length,
        edges: graph.edges.length,
        sensitiveSignals: graph.nodes.filter((n) => n.type === "sensitive").length || sensitiveFindings.length,
        brokenLinks: countBrokenLinks(graph)
      },
      sourceStatuses,
      fromBackendGraph,
      isLoading,
      isError,
      isEmpty: !isLoading && !isError && graph.nodes.length === 0,
      sensitiveUnavailable: sensitive.isError,
      qualityUnavailable: qualityIssuesQ.isError,
      refetch: () => {
        lineage.refetch();
        aiSystems.refetch();
        evidence.refetch();
        risks.refetch();
        incidents.refetch();
        reports.refetch();
        integrations.refetch();
        sources.refetch();
        pipelines.refetch();
        sensitive.refetch();
        qualityIssuesQ.refetch();
      }
    };
  }, [lineage, aiSystems, evidence, risks, incidents, reports, integrations, sources, pipelines, sensitive, qualityIssuesQ]);
}
