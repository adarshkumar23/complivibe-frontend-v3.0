"use client";

import { useQuery } from "@tanstack/react-query";
import { getAssuranceCases, getAssuranceSummary } from "@/lib/api/assurance";
import { getComplianceEvidence, getRisks } from "@/lib/api/compliance";
import { getReports } from "@/lib/api/reports";
import { getAuditPacks } from "@/lib/api/audit-pack";
import { getQuestionnaires } from "@/lib/api/questionnaires";
import { getIncidents } from "@/lib/api/incidents";
import { getAiSystems } from "@/lib/api/ai-systems";
import { getTrustCenter } from "@/lib/api/trust-center";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn });
}

export function useAssurance() {
  const cases = useEndpoint("assurance-cases", getAssuranceCases);
  const summary = useEndpoint("assurance-summary", getAssuranceSummary);

  // Confirmed governance resources, shown as real "linked work available for review".
  const evidence = useEndpoint("cmp-evidence", getComplianceEvidence);
  const reports = useEndpoint("reports", getReports);
  const auditPacks = useEndpoint("audit-packs", getAuditPacks);
  const questionnaires = useEndpoint("questionnaires", getQuestionnaires);
  const risks = useEndpoint("risks", getRisks);
  const incidents = useEndpoint("incidents", getIncidents);
  const aiSystems = useEndpoint("ai-systems", getAiSystems);
  const trustCenter = useEndpoint("trust-center", getTrustCenter);

  return { cases, summary, evidence, reports, auditPacks, questionnaires, risks, incidents, aiSystems, trustCenter };
}

export type AssuranceData = ReturnType<typeof useAssurance>;
