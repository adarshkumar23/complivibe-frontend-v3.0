"use client";

import { useQuery } from "@tanstack/react-query";
import { getWorkflows } from "@/lib/api/workflows";
import { getApprovals } from "@/lib/api/approvals";
import { getAssuranceCases } from "@/lib/api/assurance";
import { getReports } from "@/lib/api/reports";
import { getAuditPacks } from "@/lib/api/audit-pack";
import { getQuestionnaires } from "@/lib/api/questionnaires";
import { getComplianceEvidence, getRisks } from "@/lib/api/compliance";
import { getIncidents } from "@/lib/api/incidents";
import { getAiSystems } from "@/lib/api/ai-systems";
import { getTrustCenter } from "@/lib/api/trust-center";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn, retry: false });
}

export function useWorkflows() {
  const workflows = useEndpoint("workflows", getWorkflows);

  // Confirmed governance resources shown as real linked work.
  const approvals = useEndpoint("approvals", getApprovals);
  const assurance = useEndpoint("assurance-cases", getAssuranceCases);
  const reports = useEndpoint("reports", getReports);
  const auditPacks = useEndpoint("audit-packs", getAuditPacks);
  const questionnaires = useEndpoint("questionnaires", getQuestionnaires);
  const evidence = useEndpoint("cmp-evidence", getComplianceEvidence);
  const risks = useEndpoint("risks", getRisks);
  const incidents = useEndpoint("incidents", getIncidents);
  const aiSystems = useEndpoint("ai-systems", getAiSystems);
  const trustCenter = useEndpoint("trust-center", getTrustCenter);

  return { workflows, approvals, assurance, reports, auditPacks, questionnaires, evidence, risks, incidents, aiSystems, trustCenter };
}

export type WorkflowsData = ReturnType<typeof useWorkflows>;
