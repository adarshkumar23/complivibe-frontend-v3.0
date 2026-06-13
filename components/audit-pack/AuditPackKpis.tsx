"use client";

import { Boxes, PackageCheck, FileCheck2, TriangleAlert, ClipboardCheck, Download } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { pickScore } from "@/lib/hooks/useCommandCenter";
import { normalizeAuditPacks, isReady, sumCount } from "@/lib/api/audit-pack-normalizers";
import { normalizeEvidenceItems } from "@/lib/api/evidence-normalizers";
import { normalizeRisks, isMitigated } from "@/lib/api/risk-normalizers";
import { normalizeIncidents, isResolved } from "@/lib/api/incident-normalizers";
import type { AuditPackData } from "@/lib/hooks/useAuditPack";

export function AuditPackKpis({ data }: { data: AuditPackData }) {
  const { packs, evidence, risks, incidents, scores, executive } = data;
  const list = normalizeAuditPacks(packs.data);
  const ok = packs.isSuccess;
  const loading = packs.isLoading;

  const total = ok ? list.length : null;
  const anyStatus = list.some((p) => p.status);
  const ready = ok && anyStatus ? list.filter((p) => isReady(p.status)).length : null;

  // Evidence included: sum from packs if present, else total evidence records
  const evidenceFromPacks = sumCount(list, "evidenceCount");
  const evidenceTotal = evidence.isSuccess ? normalizeEvidenceItems(evidence.data).length : null;
  const evidenceIncluded = evidenceFromPacks ?? evidenceTotal;

  // Open issues = open risks + open incidents (real)
  const riskList = normalizeRisks(risks.data);
  const openRisks = risks.isSuccess ? riskList.filter((r) => !isMitigated(r.status)).length : null;
  const incList = normalizeIncidents(incidents.data);
  const openInc = incidents.isSuccess ? incList.filter((i) => !isResolved(i.status)).length : null;
  const openIssues = openRisks == null && openInc == null ? null : (openRisks ?? 0) + (openInc ?? 0);

  const audit = pickScore([scores.data, executive.data], ["audit_readiness", "audit_readiness_score", "audit_score", "audit", "readiness.audit"]);
  const exportable = ok ? list.filter((p) => p.url).length : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      <RegistryKpi label="Total Audit Packs" icon={Boxes} accent="blue" value={total} caption={total != null ? "in library" : undefined} loading={loading} unavailableHint="Library unavailable" />
      <RegistryKpi label="Ready Packs" icon={PackageCheck} accent="green" value={ready} caption={ready != null ? "generated" : undefined} loading={loading} unavailableHint="No status field" />
      <RegistryKpi label="Evidence Included" icon={FileCheck2} accent="cyan" value={evidenceIncluded} caption={evidenceIncluded != null ? (evidenceFromPacks != null ? "across packs" : "available") : undefined} loading={loading && evidence.isLoading} unavailableHint="No evidence" />
      <RegistryKpi label="Open Issues" icon={TriangleAlert} accent="amber" value={openIssues} caption={openIssues != null ? "risks + incidents" : undefined} loading={risks.isLoading && incidents.isLoading} unavailableHint="No risk/incident data" />
      <RegistryKpi label="Audit Readiness" icon={ClipboardCheck} accent="purple" value={audit} suffix={audit != null ? "/100" : ""} scoreToneFor={audit} caption={audit != null ? "audit posture" : undefined} loading={loading && scores.isLoading} unavailableHint="No score returned" />
      <RegistryKpi label="Exportable Packs" icon={Download} accent="teal" value={exportable} caption={exportable != null ? "with download link" : undefined} loading={loading} unavailableHint="Library unavailable" />
    </div>
  );
}
