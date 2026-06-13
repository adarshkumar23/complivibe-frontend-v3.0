"use client";

import { useQuery } from "@tanstack/react-query";
import { getReports, getReportTemplates } from "@/lib/api/reports";
import { getFrameworks } from "@/lib/api/compliance";
import { getAiSystems } from "@/lib/api/ai-systems";
import { getComplianceEvidence } from "@/lib/api/compliance";
import { getRisks } from "@/lib/api/risks";
import { getIncidents } from "@/lib/api/incidents";
import { getScoresSummary, getExecutiveSummary } from "@/lib/api/command";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn });
}

export function useReports() {
  const reports = useEndpoint("reports", getReports);
  const templates = useEndpoint("report-templates", getReportTemplates);
  const frameworks = useEndpoint("cmp-frameworks", getFrameworks);
  const aiSystems = useEndpoint("ai-systems", getAiSystems);
  const evidence = useEndpoint("cmp-evidence", getComplianceEvidence);
  const risks = useEndpoint("risks", getRisks);
  const incidents = useEndpoint("incidents", getIncidents);
  const scores = useEndpoint("scores-summary", getScoresSummary);
  const executive = useEndpoint("executive-summary", getExecutiveSummary);

  return { reports, templates, frameworks, aiSystems, evidence, risks, incidents, scores, executive };
}

export type ReportsData = ReturnType<typeof useReports>;
