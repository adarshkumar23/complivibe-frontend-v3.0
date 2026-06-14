"use client";

import { ShieldCheck, BrainCircuit, Database, ClipboardCheck } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { pickScore, type CommandCenter } from "@/lib/hooks/useCommandCenter";
import type { GovernanceCoverage } from "@/lib/hooks/useGovernanceCoverage";
import type { Accent } from "@/components/ui/accent";

type Kpi = {
  label: string;
  icon: typeof ShieldCheck;
  accent: Accent;
  paths: string[];
  /**
   * Honest fallback shown when no official score endpoint/field is available, derived from real
   * source-record coverage. Never fabricates a score; returns null when no source records exist.
   */
  derive: (coverage: GovernanceCoverage) => string | null;
};

/** Sum real counts for a set of coverage ids (only counts that returned records). */
function sumCounts(coverage: GovernanceCoverage, ids: string[]): number {
  return ids.reduce((total, id) => total + (coverage.byId[id]?.count ?? 0), 0);
}

const KPIS: Kpi[] = [
  {
    label: "Governance Health",
    icon: BrainCircuit,
    accent: "purple",
    paths: [
      "governance_health",
      "governance_score",
      "ai_governance",
      "governance",
      "scores.governance",
      "ai_governance_score"
    ],
    derive: (c) => {
      const n = sumCounts(c, ["ai-systems"]);
      return n > 0 ? `Source records available · ${n.toLocaleString()} AI systems` : null;
    }
  },
  {
    label: "Compliance Readiness",
    icon: ShieldCheck,
    accent: "blue",
    paths: [
      "compliance_readiness",
      "compliance_score",
      "compliance",
      "scores.compliance",
      "readiness.compliance",
      "overall_compliance"
    ],
    derive: (c) => {
      const n = sumCounts(c, ["evidence", "risks", "deadlines"]);
      return n > 0 ? `Coverage available · ${n.toLocaleString()} source records` : null;
    }
  },
  {
    label: "Data Health",
    icon: Database,
    accent: "cyan",
    paths: [
      "data_health",
      "data_health_score",
      "data_observability",
      "data",
      "scores.data_health",
      "observability_score"
    ],
    derive: (c) => {
      const obs = c.byId["data-observability"];
      if (!obs || obs.status === "unavailable") return null;
      return obs.count != null && obs.count > 0
        ? `Records available · ${obs.count.toLocaleString()} data sources`
        : "Records available";
    }
  },
  {
    label: "Audit Readiness",
    icon: ClipboardCheck,
    accent: "teal",
    paths: [
      "audit_readiness",
      "audit_readiness_score",
      "audit_score",
      "audit",
      "scores.audit",
      "readiness.audit"
    ],
    derive: (c) => {
      const n = sumCounts(c, ["audit-packs", "reports", "evidence"]);
      return n > 0 ? `Derived coverage available · ${n.toLocaleString()} records` : null;
    }
  }
];

export function KpiRow({ data, coverage }: { data: CommandCenter; coverage: GovernanceCoverage }) {
  const sources = [data.scores.data, data.unified.data, data.executive.data];
  const loading = data.scores.isLoading && data.unified.isLoading && data.executive.isLoading;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {KPIS.map((kpi) => {
        const score = pickScore(sources, kpi.paths);
        // Only derive a coverage hint when there is genuinely no official score.
        const hint = score == null ? kpi.derive(coverage) : null;
        return (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            icon={kpi.icon}
            accent={kpi.accent}
            value={score}
            loading={loading}
            unavailableHint={hint ?? "Awaiting score endpoint"}
          />
        );
      })}
    </div>
  );
}
