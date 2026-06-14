"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getProactiveInsights, getRegulatoryDeadlines, getComplianceEvidence, getRisks, getIncidents,
  getQuestionnaires, getAiSystems, getApprovals, getAssuranceCases
} from "@/lib/api/insights";
import { normalizeBackendInsights, buildDerivedInsights, type Insight, type InsightSources } from "@/lib/api/insight-normalizers";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn, retry: false });
}

export function useProactiveInsights() {
  const feed = useEndpoint("proactive-insights", getProactiveInsights);

  const risks = useEndpoint("risks", getRisks);
  const incidents = useEndpoint("incidents", getIncidents);
  const regulatory = useEndpoint("regulatory-deadlines", getRegulatoryDeadlines);
  const questionnaires = useEndpoint("questionnaires", getQuestionnaires);
  const aiSystems = useEndpoint("ai-systems", getAiSystems);
  const approvals = useEndpoint("approvals", getApprovals);
  const assurance = useEndpoint("assurance-cases", getAssuranceCases);
  const evidence = useEndpoint("cmp-evidence", getComplianceEvidence);

  const sourceQueries = [risks, incidents, regulatory, questionnaires, aiSystems, approvals, assurance, evidence];

  // Prefer a real backend insight feed; otherwise derive factual insights from real records.
  const backendInsights = feed.isSuccess ? normalizeBackendInsights(feed.data) : [];
  const usingBackend = backendInsights.length > 0;

  const insights: Insight[] = useMemo(() => {
    if (usingBackend) return backendInsights;
    const s: InsightSources = {};
    if (risks.isSuccess) s.risks = risks.data;
    if (incidents.isSuccess) s.incidents = incidents.data;
    if (regulatory.isSuccess) s.regulatory = regulatory.data;
    if (questionnaires.isSuccess) s.questionnaires = questionnaires.data;
    if (aiSystems.isSuccess) s.aiSystems = aiSystems.data;
    if (approvals.isSuccess) s.approvals = approvals.data;
    if (assurance.isSuccess) s.assurance = assurance.data;
    if (evidence.isSuccess) s.evidence = evidence.data;
    return buildDerivedInsights(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usingBackend, feed.data, risks.data, incidents.data, regulatory.data, questionnaires.data, aiSystems.data, approvals.data, assurance.data, evidence.data]);

  const isLoading = feed.isLoading || sourceQueries.some((s) => s.isLoading);
  const anyAvailable = usingBackend || sourceQueries.some((s) => s.isSuccess);
  const allUnavailable = !isLoading && !anyAvailable;

  return { feed, insights, usingBackend, risks, incidents, regulatory, questionnaires, aiSystems, approvals, assurance, evidence, isLoading, anyAvailable, allUnavailable };
}

export type ProactiveInsightsData = ReturnType<typeof useProactiveInsights>;
