"use client";

import { Gauge, Globe, FileBarChart, FileCheck2, Award, TriangleAlert } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { pickScore } from "@/lib/hooks/useCommandCenter";
import { normalizeTrustAssets, isPublished, normalizeCertifications } from "@/lib/api/trust-center-normalizers";
import { normalizeReports } from "@/lib/api/report-normalizers";
import { normalizeEvidenceItems } from "@/lib/api/evidence-normalizers";
import { normalizeRisks, isMitigated } from "@/lib/api/risk-normalizers";
import { normalizeIncidents, isResolved } from "@/lib/api/incident-normalizers";
import type { TrustCenterData } from "@/lib/hooks/useTrustCenter";

export function TrustKpis({ data }: { data: TrustCenterData }) {
  const { trust, metrics, assets, reports, evidence, certifications, risks, incidents, scores, executive } = data;

  const trustScore = pickScore(
    [trust.data, metrics.data, scores.data, executive.data],
    ["trust_score", "trust", "overall_score", "score", "governance_score"]
  );

  const assetList = normalizeTrustAssets(assets.data);
  // Count only assets the backend marks as published/public — never assume unmarked assets are published.
  const published = assets.isSuccess ? assetList.filter(isPublished).length : null;

  const reportCount = reports.isSuccess ? normalizeReports(reports.data).length : null;
  const evidenceCount = evidence.isSuccess ? normalizeEvidenceItems(evidence.data).length : null;
  const certCount = certifications.isSuccess ? normalizeCertifications(certifications.data).length : null;

  const openRisks = risks.isSuccess ? normalizeRisks(risks.data).filter((r) => !isMitigated(r.status)).length : null;
  const openInc = incidents.isSuccess ? normalizeIncidents(incidents.data).filter((i) => !isResolved(i.status)).length : null;
  const openIssues = openRisks == null && openInc == null ? null : (openRisks ?? 0) + (openInc ?? 0);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      <RegistryKpi label="Trust Score" icon={Gauge} accent="purple" value={trustScore} suffix={trustScore != null ? "/100" : ""} scoreToneFor={trustScore} caption={trustScore != null ? "overall trust" : undefined} loading={trust.isLoading && scores.isLoading} unavailableHint="No score returned" />
      <RegistryKpi label="Published Assets" icon={Globe} accent="blue" value={published} caption={published != null ? "shared publicly" : undefined} loading={assets.isLoading} unavailableHint="Assets unavailable" />
      <RegistryKpi label="Available Reports" icon={FileBarChart} accent="cyan" value={reportCount} caption={reportCount != null ? "in library" : undefined} loading={reports.isLoading} unavailableHint="No reports" />
      <RegistryKpi label="Evidence Items" icon={FileCheck2} accent="green" value={evidenceCount} caption={evidenceCount != null ? "audit-ready" : undefined} loading={evidence.isLoading} unavailableHint="No evidence" />
      <RegistryKpi label="Certifications" icon={Award} accent="amber" value={certCount} caption={certCount != null ? "held" : undefined} loading={certifications.isLoading} unavailableHint="Certs unavailable" />
      <RegistryKpi label="Open Issues" icon={TriangleAlert} accent="red" value={openIssues} caption={openIssues != null ? "risks + incidents" : undefined} loading={risks.isLoading && incidents.isLoading} unavailableHint="No risk/incident data" />
    </div>
  );
}
