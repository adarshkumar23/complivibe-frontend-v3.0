"use client";

import { useQuery } from "@tanstack/react-query";
import { getAuditPacks } from "@/lib/api/audit-pack";
import { getReports } from "@/lib/api/reports";
import { getComplianceEvidence, getFrameworks } from "@/lib/api/compliance";
import { getAiSystems } from "@/lib/api/ai-systems";
import { getRisks } from "@/lib/api/risks";
import { getIncidents } from "@/lib/api/incidents";
import { getScoresSummary, getExecutiveSummary } from "@/lib/api/command";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn });
}

export function useAuditPack() {
  const packs = useEndpoint("audit-packs", getAuditPacks);
  const reports = useEndpoint("reports", getReports);
  const evidence = useEndpoint("cmp-evidence", getComplianceEvidence);
  const frameworks = useEndpoint("cmp-frameworks", getFrameworks);
  const aiSystems = useEndpoint("ai-systems", getAiSystems);
  const risks = useEndpoint("risks", getRisks);
  const incidents = useEndpoint("incidents", getIncidents);
  const scores = useEndpoint("scores-summary", getScoresSummary);
  const executive = useEndpoint("executive-summary", getExecutiveSummary);

  return { packs, reports, evidence, frameworks, aiSystems, risks, incidents, scores, executive };
}

export type AuditPackData = ReturnType<typeof useAuditPack>;
