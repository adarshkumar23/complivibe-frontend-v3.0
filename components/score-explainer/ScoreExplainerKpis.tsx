"use client";

import { Gauge, FileCheck2, TriangleAlert, ClipboardCheck } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { overallScore, normalizeScoreComponents, riskImpact } from "@/lib/api/score-explainer-normalizers";
import type { ScoreExplainerData } from "@/lib/hooks/useScoreExplainer";

export function ScoreExplainerKpis({ data }: { data: ScoreExplainerData }) {
  const { scores, unified, executive, overview, governance, aiGovernance, explain, risks, scoreLoading } = data;
  const scoreSrc = [scores.data, unified.data, executive.data, overview.data, governance.data, aiGovernance.data, explain.data];

  const overall = overallScore(scoreSrc);
  const components = normalizeScoreComponents(...scoreSrc);
  const evidenceCov = components.evidence;
  const audit = components.auditReadiness;

  const rImpact = risks.isSuccess ? riskImpact(risks.data) : null;
  const openRisk = rImpact ? rImpact.highCritical : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi label="Overall Score" icon={Gauge} accent="purple" value={overall} suffix={overall != null ? "/100" : ""} scoreToneFor={overall} caption={overall != null ? "backend score" : undefined} loading={scoreLoading} unavailableHint="No score returned" />
      <RegistryKpi label="Evidence Coverage" icon={FileCheck2} accent="green" value={evidenceCov} suffix={evidenceCov != null ? "/100" : ""} scoreToneFor={evidenceCov} caption={evidenceCov != null ? "coverage score" : undefined} loading={scoreLoading} unavailableHint="No coverage score" />
      <RegistryKpi label="Open Risk Impact" icon={TriangleAlert} accent="red" value={openRisk} caption={openRisk != null ? "high/critical risks" : undefined} loading={risks.isLoading} unavailableHint="No risk severity" />
      <RegistryKpi label="Review Readiness" icon={ClipboardCheck} accent="teal" value={audit} suffix={audit != null ? "/100" : ""} scoreToneFor={audit} caption={audit != null ? "audit readiness" : undefined} loading={scoreLoading} unavailableHint="No readiness score" />
    </div>
  );
}
