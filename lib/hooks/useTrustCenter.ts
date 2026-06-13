"use client";

import { useQuery } from "@tanstack/react-query";
import { getTrustCenter, getTrustCenterAssets, getTrustCenterMetrics } from "@/lib/api/trust-center";
import { getReports } from "@/lib/api/reports";
import { getAuditPacks } from "@/lib/api/audit-pack";
import { getComplianceEvidence, getFrameworks } from "@/lib/api/compliance";
import { getAiSystems } from "@/lib/api/ai-systems";
import { getRisks } from "@/lib/api/risks";
import { getIncidents } from "@/lib/api/incidents";
import { getCertifications } from "@/lib/api/trust-center";
import { getScoresSummary, getExecutiveSummary } from "@/lib/api/command";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn });
}

export function useTrustCenter() {
  const trust = useEndpoint("trust-center", getTrustCenter);
  const assets = useEndpoint("trust-assets", getTrustCenterAssets);
  const metrics = useEndpoint("trust-metrics", getTrustCenterMetrics);
  const reports = useEndpoint("reports", getReports);
  const auditPacks = useEndpoint("audit-packs", getAuditPacks);
  const evidence = useEndpoint("cmp-evidence", getComplianceEvidence);
  const frameworks = useEndpoint("cmp-frameworks", getFrameworks);
  const aiSystems = useEndpoint("ai-systems", getAiSystems);
  const risks = useEndpoint("risks", getRisks);
  const incidents = useEndpoint("incidents", getIncidents);
  const certifications = useEndpoint("certifications", getCertifications);
  const scores = useEndpoint("scores-summary", getScoresSummary);
  const executive = useEndpoint("executive-summary", getExecutiveSummary);

  return { trust, assets, metrics, reports, auditPacks, evidence, frameworks, aiSystems, risks, incidents, certifications, scores, executive };
}

export type TrustCenterData = ReturnType<typeof useTrustCenter>;
