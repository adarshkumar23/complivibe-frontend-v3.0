/**
 * No dedicated trust-graph backend endpoint is confirmed, so the graph is built client-side by
 * deriving nodes/edges from REAL records returned by confirmed module endpoints. This module
 * re-exports the source getters the graph hook fetches — no new endpoints are invented.
 */
export { getAiSystems } from "@/lib/api/ai-systems";
export { getComplianceEvidence, getRisks, getCertifications } from "@/lib/api/compliance";
export { getIncidents } from "@/lib/api/incidents";
export { getReports } from "@/lib/api/reports";
export { getAuditPacks } from "@/lib/api/audit-pack";
export { getQuestionnaires } from "@/lib/api/questionnaires";
export { getTrustCenter } from "@/lib/api/trust-center";
export { getPolicies } from "@/lib/api/policies";
export { getVendors } from "@/lib/api/vendor-risk";
export { getRegulatoryDeadlines } from "@/lib/api/command";
export { getApprovals } from "@/lib/api/approvals";
export { getAssuranceCases } from "@/lib/api/assurance";
export { getIntegrations } from "@/lib/api/integrations";
