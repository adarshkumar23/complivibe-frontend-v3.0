"use client";

import { Gauge } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AiSystemsData } from "@/lib/hooks/useAiSystems";

/** Governance scorecard from GET /api/v1/ai-governance/scorecard. */
export function GovernanceSummary({ data }: { data: AiSystemsData }) {
  const { scorecard } = data;
  const sc = scorecard.data?.scorecard;

  const rows: { label: string; value: string; tone: "good" | "warn" | "bad" | "neutral" }[] = sc
    ? [
        {
          label: "Avg governance score",
          value:
            sc.with_governance_score > 0
              ? `${Math.round(sc.avg_governance_score)} (${sc.with_governance_score} scored)`
              : "no systems scored yet",
          tone: sc.with_governance_score > 0 ? (sc.avg_governance_score >= 70 ? "good" : "warn") : "neutral"
        },
        {
          label: "Bias assessment coverage",
          value: `${Math.round(sc.bias_assessment_coverage)}%`,
          tone: sc.bias_assessment_coverage >= 70 ? "good" : sc.bias_assessment_coverage > 0 ? "warn" : "neutral"
        },
        {
          label: "Oversight level set",
          value: `${Math.round(sc.oversight_level_set)}%`,
          tone: sc.oversight_level_set >= 70 ? "good" : sc.oversight_level_set > 0 ? "warn" : "neutral"
        },
        {
          label: "High-risk without oversight",
          value: String(sc.high_risk_no_oversight_count),
          tone: sc.high_risk_no_oversight_count > 0 ? "bad" : "good"
        }
      ]
    : [];

  return (
    <SectionCard title="Governance Scorecard" subtitle="How governed the AI estate actually is" icon={Gauge} accent="teal">
      {scorecard.isLoading ? (
        <SkeletonRows rows={4} />
      ) : scorecard.isError ? (
        <ErrorState compact title="Unable to load scorecard" onRetry={() => scorecard.refetch()} />
      ) : (
        <ul className="space-y-2.5">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <span className="text-[13px] font-semibold text-cv-ink">{r.label}</span>
              <StatusBadge label={r.value} tone={r.tone} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
