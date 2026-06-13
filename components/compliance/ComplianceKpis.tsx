"use client";

import { Gauge, LayoutGrid, FileCheck2, ClipboardCheck } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { pickScore } from "@/lib/hooks/useCommandCenter";
import type { Compliance } from "@/lib/hooks/useCompliance";
import { normalizeFrameworks } from "@/lib/api/compliance-normalizers";
import { normalizeEvidence } from "@/lib/api/normalizers";

export function ComplianceKpis({ data }: { data: Compliance }) {
  const { score, overview, scores, frameworks, evidence } = data;

  const loading = score.isLoading && overview.isLoading && scores.isLoading;

  // Overall compliance score — real backend value
  const overall = pickScore(
    [score.data, overview.data, scores.data],
    ["compliance_score", "overall_score", "compliance_readiness", "score", "overall", "value"]
  );

  // Framework coverage — average of real framework coverage values, else overview field
  const fw = normalizeFrameworks(frameworks.data);
  const withCoverage = fw.filter((f) => f.coverage != null);
  const fwAvg =
    withCoverage.length > 0
      ? Math.round(withCoverage.reduce((s, f) => s + (f.coverage as number), 0) / withCoverage.length)
      : pickScore([overview.data], ["framework_coverage", "coverage", "coverage_percentage"]);

  // Evidence health — fresh / total ratio when counts exist, else overview field
  const ev = normalizeEvidence(evidence.data);
  const evidenceHealth =
    ev.freshCount != null && ev.totalCount > 0
      ? Math.round((ev.freshCount / ev.totalCount) * 100)
      : pickScore([overview.data], ["evidence_health", "evidence_score", "evidence_freshness"]);

  // Audit readiness — real backend value
  const audit = pickScore(
    [overview.data, scores.data, score.data],
    ["audit_readiness", "audit_readiness_score", "audit_score", "audit", "readiness.audit"]
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Overall Compliance Score" icon={Gauge} accent="blue" value={overall} loading={loading} />
      <StatCard
        label="Framework Coverage"
        icon={LayoutGrid}
        accent="purple"
        value={fwAvg}
        suffix="%"
        loading={loading || frameworks.isLoading}
      />
      <StatCard
        label="Evidence Health"
        icon={FileCheck2}
        accent="green"
        value={evidenceHealth}
        suffix="%"
        loading={loading || evidence.isLoading}
      />
      <StatCard label="Audit Readiness" icon={ClipboardCheck} accent="teal" value={audit} loading={loading} />
    </div>
  );
}
