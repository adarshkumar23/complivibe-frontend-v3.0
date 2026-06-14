"use client";

import { ShieldCheck, FileCheck2, TriangleAlert, CalendarClock } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { normalizeScoreComponents } from "@/lib/api/executive-normalizers";
import { riskImpact } from "@/lib/api/score-explainer-normalizers";
import { normalizeRegulatoryDeadlines } from "@/lib/api/regulatory-normalizers";
import type { ExecutiveSummaryData } from "@/lib/hooks/useExecutiveSummary";

export function ExecutiveKpis({ data }: { data: ExecutiveSummaryData }) {
  const { executive, scores, unified, overview, complianceScore, governance, aiGovernance, risks, regulatory, scoreLoading } = data;
  const c = normalizeScoreComponents(executive.data, scores.data, unified.data, overview.data, complianceScore.data, governance.data, aiGovernance.data);

  const govReadiness = c.governance;
  const evidenceCov = c.evidence;

  const rImpact = risks.isSuccess ? riskImpact(risks.data) : null;
  const openRisk = rImpact ? rImpact.highCritical : null;

  const upcoming = regulatory.isSuccess ? normalizeRegulatoryDeadlines(regulatory.data).filter((d) => d.daysRemaining != null && d.daysRemaining >= 0).length : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi label="Governance Readiness" icon={ShieldCheck} accent="purple" value={govReadiness} suffix={govReadiness != null ? "/100" : ""} scoreToneFor={govReadiness} caption={govReadiness != null ? "backend score" : undefined} loading={scoreLoading} unavailableHint="No score returned" />
      <RegistryKpi label="Evidence Coverage" icon={FileCheck2} accent="green" value={evidenceCov} suffix={evidenceCov != null ? "/100" : ""} scoreToneFor={evidenceCov} caption={evidenceCov != null ? "coverage score" : undefined} loading={scoreLoading} unavailableHint="No coverage score" />
      <RegistryKpi label="Open Risk Exposure" icon={TriangleAlert} accent="red" value={openRisk} caption={openRisk != null ? "high/critical risks" : undefined} loading={risks.isLoading} unavailableHint="No risk severity" />
      <RegistryKpi label="Upcoming Deadlines" icon={CalendarClock} accent="amber" value={upcoming} caption={upcoming != null ? "on the horizon" : undefined} loading={regulatory.isLoading} unavailableHint="No deadline data" />
    </div>
  );
}
