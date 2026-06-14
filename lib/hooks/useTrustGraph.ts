"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getAiSystems, getComplianceEvidence, getRisks, getIncidents, getReports, getAuditPacks,
  getQuestionnaires, getTrustCenter, getPolicies, getVendors, getRegulatoryDeadlines,
  getCertifications, getApprovals, getAssuranceCases, getIntegrations
} from "@/lib/api/trust-graph";
import { buildGraph, type NodeType, type GraphSources } from "@/lib/api/trust-graph-normalizers";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn, retry: false });
}

export type GraphSourceStatus = { key: NodeType; available: boolean; loading: boolean; error: boolean };

export function useTrustGraph() {
  const q = {
    "ai-system": useEndpoint("ai-systems", getAiSystems),
    evidence: useEndpoint("cmp-evidence", getComplianceEvidence),
    risk: useEndpoint("risks", getRisks),
    incident: useEndpoint("incidents", getIncidents),
    report: useEndpoint("reports", getReports),
    "audit-pack": useEndpoint("audit-packs", getAuditPacks),
    questionnaire: useEndpoint("questionnaires", getQuestionnaires),
    "trust-asset": useEndpoint("trust-center", getTrustCenter),
    policy: useEndpoint("policies", getPolicies),
    vendor: useEndpoint("vendors", getVendors),
    regulatory: useEndpoint("regulatory-deadlines", getRegulatoryDeadlines),
    certification: useEndpoint("certifications", getCertifications),
    approval: useEndpoint("approvals", getApprovals),
    assurance: useEndpoint("assurance-cases", getAssuranceCases),
    integration: useEndpoint("integrations", getIntegrations)
  } as Record<NodeType, ReturnType<typeof useEndpoint>>;

  const keys = Object.keys(q) as NodeType[];

  const graph = useMemo(() => {
    const sources: GraphSources = {};
    for (const k of keys) if (q[k].isSuccess) sources[k] = q[k].data;
    return buildGraph(sources);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, keys.map((k) => q[k].data));

  const sourceStatuses: GraphSourceStatus[] = keys.map((k) => ({ key: k, available: q[k].isSuccess, loading: q[k].isLoading, error: q[k].isError }));
  const isLoading = keys.some((k) => q[k].isLoading);
  const availableCount = sourceStatuses.filter((s) => s.available).length;
  const unavailableCount = sourceStatuses.filter((s) => !s.available && !s.loading).length;
  const allUnavailable = !isLoading && availableCount === 0;

  return { ...graph, sourceStatuses, isLoading, availableCount, unavailableCount, allUnavailable };
}

export type TrustGraphData = ReturnType<typeof useTrustGraph>;
