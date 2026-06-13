"use client";

import { ShieldCheck, BrainCircuit, Database, ClipboardCheck } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { pickScore, type CommandCenter } from "@/lib/hooks/useCommandCenter";
import type { Accent } from "@/components/ui/accent";

type Kpi = {
  label: string;
  icon: typeof ShieldCheck;
  accent: Accent;
  paths: string[];
};

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
    ]
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
    ]
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
    ]
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
    ]
  }
];

export function KpiRow({ data }: { data: CommandCenter }) {
  const sources = [data.scores.data, data.unified.data, data.executive.data];
  const loading = data.scores.isLoading && data.unified.isLoading && data.executive.isLoading;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {KPIS.map((kpi) => (
        <StatCard
          key={kpi.label}
          label={kpi.label}
          icon={kpi.icon}
          accent={kpi.accent}
          value={pickScore(sources, kpi.paths)}
          loading={loading}
        />
      ))}
    </div>
  );
}
