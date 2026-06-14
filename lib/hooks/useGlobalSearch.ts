"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getAiSystems, getComplianceEvidence, getRisks, getIncidents, getReports, getAuditPacks,
  getQuestionnaires, getTrustCenter, getPolicies, getVendors, getRegulatoryDeadlines,
  getCertifications, getPredictiveAlerts, getApprovals, getAssuranceCases, getIntegrations,
  getAutomationRules, getWorkflows
} from "@/lib/api/search";
import { buildSearchIndex, type SearchCategoryKey, type SearchSources } from "@/lib/api/search-normalizers";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn, retry: false });
}

export type SourceStatus = { key: SearchCategoryKey; available: boolean; loading: boolean; error: boolean };

export function useGlobalSearch() {
  const q = {
    "ai-systems": useEndpoint("ai-systems", getAiSystems),
    evidence: useEndpoint("cmp-evidence", getComplianceEvidence),
    risks: useEndpoint("risks", getRisks),
    incidents: useEndpoint("incidents", getIncidents),
    reports: useEndpoint("reports", getReports),
    "audit-packs": useEndpoint("audit-packs", getAuditPacks),
    questionnaires: useEndpoint("questionnaires", getQuestionnaires),
    "trust-center": useEndpoint("trust-center", getTrustCenter),
    policies: useEndpoint("policies", getPolicies),
    vendors: useEndpoint("vendors", getVendors),
    regulatory: useEndpoint("regulatory-deadlines", getRegulatoryDeadlines),
    certifications: useEndpoint("certifications", getCertifications),
    alerts: useEndpoint("predictive-alerts", getPredictiveAlerts),
    approvals: useEndpoint("approvals", getApprovals),
    assurance: useEndpoint("assurance-cases", getAssuranceCases),
    integrations: useEndpoint("integrations", getIntegrations),
    automation: useEndpoint("automation-rules", getAutomationRules),
    workflows: useEndpoint("workflows", getWorkflows)
  } as Record<SearchCategoryKey, ReturnType<typeof useEndpoint>>;

  const keys = Object.keys(q) as SearchCategoryKey[];

  const records = useMemo(() => {
    const sources: SearchSources = {};
    for (const k of keys) if (q[k].isSuccess) sources[k] = q[k].data;
    return buildSearchIndex(sources);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, keys.map((k) => q[k].data));

  const sourceStatuses: SourceStatus[] = keys.map((k) => ({ key: k, available: q[k].isSuccess, loading: q[k].isLoading, error: q[k].isError }));
  const isLoading = keys.some((k) => q[k].isLoading);
  const availableCount = sourceStatuses.filter((s) => s.available).length;
  const unavailableCount = sourceStatuses.filter((s) => !s.available && !s.loading).length;
  const allUnavailable = !isLoading && availableCount === 0;

  return { records, sourceStatuses, isLoading, availableCount, unavailableCount, allUnavailable };
}

export type GlobalSearchData = ReturnType<typeof useGlobalSearch>;
