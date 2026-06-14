"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getScoresSummary, getUnifiedHealthScore, getExecutiveSummary, getComplianceOverview,
  getGovernanceScore, getAiGovernanceSummary, getScoreExplain,
  getComplianceEvidence, getRisks, getIncidents, getRegulatoryDeadlines, getApprovals,
  getAssuranceCases, getQuestionnaires, getTrustCenter, getVendors, getAiSystems
} from "@/lib/api/score-explainer";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn, retry: false });
}

export function useScoreExplainer() {
  const scores = useEndpoint("scores-summary", getScoresSummary);
  const unified = useEndpoint("unified-health", getUnifiedHealthScore);
  const executive = useEndpoint("executive-summary", getExecutiveSummary);
  const overview = useEndpoint("cmp-overview", getComplianceOverview);
  const governance = useEndpoint("governance-score", getGovernanceScore);
  const aiGovernance = useEndpoint("ai-governance-summary", getAiGovernanceSummary);
  const explain = useEndpoint("score-explain", getScoreExplain);

  const evidence = useEndpoint("cmp-evidence", getComplianceEvidence);
  const risks = useEndpoint("risks", getRisks);
  const incidents = useEndpoint("incidents", getIncidents);
  const regulatory = useEndpoint("regulatory-deadlines", getRegulatoryDeadlines);
  const approvals = useEndpoint("approvals", getApprovals);
  const assurance = useEndpoint("assurance-cases", getAssuranceCases);
  const questionnaires = useEndpoint("questionnaires", getQuestionnaires);
  const trustCenter = useEndpoint("trust-center", getTrustCenter);
  const vendors = useEndpoint("vendors", getVendors);
  const aiSystems = useEndpoint("ai-systems", getAiSystems);

  const scoreSources = [scores, unified, executive, overview, governance, aiGovernance, explain];
  const anyScore = scoreSources.some((s) => s.isSuccess);
  const scoreLoading = scoreSources.some((s) => s.isLoading);

  return {
    scores, unified, executive, overview, governance, aiGovernance, explain,
    evidence, risks, incidents, regulatory, approvals, assurance, questionnaires, trustCenter, vendors, aiSystems,
    anyScore, scoreLoading
  };
}

export type ScoreExplainerData = ReturnType<typeof useScoreExplainer>;
