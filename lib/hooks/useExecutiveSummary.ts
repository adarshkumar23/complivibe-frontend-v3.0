"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getExecutiveSummary, getScoresSummary, getUnifiedHealthScore, getComplianceOverview, getComplianceScore,
  getGovernanceScore, getAiGovernanceSummary, getAiSystems, getComplianceEvidence, getRisks, getIncidents,
  getReports, getAuditPacks, getQuestionnaires, getTrustCenter, getRegulatoryDeadlines, getCertifications,
  getApprovals, getAssuranceCases
} from "@/lib/api/executive";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn, retry: false });
}

export function useExecutiveSummary() {
  const executive = useEndpoint("executive-summary", getExecutiveSummary);
  const scores = useEndpoint("scores-summary", getScoresSummary);
  const unified = useEndpoint("unified-health", getUnifiedHealthScore);
  const overview = useEndpoint("cmp-overview", getComplianceOverview);
  const complianceScore = useEndpoint("compliance-score", getComplianceScore);
  const governance = useEndpoint("governance-score", getGovernanceScore);
  const aiGovernance = useEndpoint("ai-governance-summary", getAiGovernanceSummary);

  const aiSystems = useEndpoint("ai-systems", getAiSystems);
  const evidence = useEndpoint("cmp-evidence", getComplianceEvidence);
  const risks = useEndpoint("risks", getRisks);
  const incidents = useEndpoint("incidents", getIncidents);
  const reports = useEndpoint("reports", getReports);
  const auditPacks = useEndpoint("audit-packs", getAuditPacks);
  const questionnaires = useEndpoint("questionnaires", getQuestionnaires);
  const trustCenter = useEndpoint("trust-center", getTrustCenter);
  const regulatory = useEndpoint("regulatory-deadlines", getRegulatoryDeadlines);
  const certifications = useEndpoint("certifications", getCertifications);
  const approvals = useEndpoint("approvals", getApprovals);
  const assurance = useEndpoint("assurance-cases", getAssuranceCases);

  const scoreSources = [executive, scores, unified, overview, complianceScore, governance, aiGovernance];
  const scoreLoading = scoreSources.some((s) => s.isLoading);
  const anyScore = scoreSources.some((s) => s.isSuccess);

  return {
    executive, scores, unified, overview, complianceScore, governance, aiGovernance,
    aiSystems, evidence, risks, incidents, reports, auditPacks, questionnaires, trustCenter, regulatory, certifications, approvals, assurance,
    scoreLoading, anyScore
  };
}

export type ExecutiveSummaryData = ReturnType<typeof useExecutiveSummary>;
