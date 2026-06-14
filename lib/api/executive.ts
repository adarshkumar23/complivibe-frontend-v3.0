/**
 * Executive Summary reuses the confirmed executive/score endpoints plus real module sources.
 * The backend executive brief is used when present; otherwise a factual brief is DERIVED from
 * real record counts (never fabricated). No new endpoints are invented.
 */
export { getExecutiveSummary, getScoresSummary, getUnifiedHealthScore, getRegulatoryDeadlines, getPredictiveAlerts } from "@/lib/api/command";
export { getComplianceOverview, getComplianceScore, getComplianceEvidence, getRisks, getCertifications } from "@/lib/api/compliance";
export { getGovernanceScore, getAiGovernanceSummary, getAiSystems } from "@/lib/api/ai-systems";
export { getIncidents } from "@/lib/api/incidents";
export { getReports } from "@/lib/api/reports";
export { getAuditPacks } from "@/lib/api/audit-pack";
export { getQuestionnaires } from "@/lib/api/questionnaires";
export { getTrustCenter } from "@/lib/api/trust-center";
export { getApprovals } from "@/lib/api/approvals";
export { getAssuranceCases } from "@/lib/api/assurance";
