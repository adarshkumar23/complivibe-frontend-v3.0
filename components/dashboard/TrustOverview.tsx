"use client";

import { Activity, ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { ScoreRing } from "@/components/charts/ScoreRing";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { pickScore, type CommandCenter } from "@/lib/hooks/useCommandCenter";
import { scoreTone } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const DIMENSIONS: { label: string; paths: string[]; color: string }[] = [
  { label: "Governance", paths: ["governance_health", "governance_score", "ai_governance", "governance"], color: "#8B5CF6" },
  { label: "Compliance", paths: ["compliance_readiness", "compliance_score", "compliance"], color: "#3B82F6" },
  { label: "Data Health", paths: ["data_health", "data_health_score", "data_observability", "data"], color: "#06B6D4" },
  { label: "Audit", paths: ["audit_readiness", "audit_score", "audit"], color: "#14B8A6" }
];

const OVERALL_PATHS = [
  "overall_score",
  "unified_health_score",
  "overall_health_score",
  "trust_score",
  "overall",
  "health_score",
  "score"
];

function Bar({ label, value, color }: { label: string; value: number | null; color: string }) {
  const has = value != null;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[13px]">
        <span className="font-semibold text-cv-ink">{label}</span>
        <span className={cn("font-bold", has ? "text-cv-ink" : "text-cv-mist")}>{has ? Math.round(value!) : "—"}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-400/12">
        {has ? (
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.max(4, Math.min(100, value!))}%`, background: color }}
          />
        ) : (
          <div className="h-full w-full bg-[repeating-linear-gradient(90deg,rgba(148,163,184,0.25)_0_8px,transparent_8px_16px)]" />
        )}
      </div>
    </div>
  );
}

export function TrustOverview({ data }: { data: CommandCenter }) {
  const sources = [data.unified.data, data.scores.data, data.executive.data];
  const loading = data.unified.isLoading && data.scores.isLoading && data.executive.isLoading;
  const errored = data.unified.isError && data.scores.isError && data.executive.isError;

  const overall = pickScore(sources, OVERALL_PATHS);
  const dims = DIMENSIONS.map((d) => ({ ...d, value: pickScore(sources, d.paths) }));
  const overallResolved = overall ?? (dims.some((d) => d.value != null)
    ? Math.round(
        dims.filter((d) => d.value != null).reduce((s, d) => s + (d.value as number), 0) /
          dims.filter((d) => d.value != null).length
      )
    : null);

  const hasAny = overallResolved != null || dims.some((d) => d.value != null);

  return (
    <SectionCard
      title="Trust Overview"
      subtitle="Unified governance lifecycle health"
      icon={ShieldCheck}
      accent="purple"
      className="h-full"
      action={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
          <Activity size={13} /> Live
        </span>
      }
    >
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <LoadingSkeleton className="mx-auto h-40 w-40 rounded-full" />
          <div className="space-y-4">
            {DIMENSIONS.map((d) => (
              <LoadingSkeleton key={d.label} className="h-8 w-full" />
            ))}
          </div>
        </div>
      ) : errored ? (
        <ErrorState onRetry={() => sources && data.unified.refetch()} />
      ) : !hasAny ? (
        <EmptyState
          icon={ShieldCheck}
          title="No trust signals yet"
          description="Governance, compliance and data health scores will appear here once your backend reports them."
        />
      ) : (
        <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center">
            <ScoreRing value={overallResolved} size={156} label="Overall trust" />
            {overallResolved != null ? (
              <span
                className={cn(
                  "mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1",
                  scoreTone(overallResolved) === "good"
                    ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20"
                    : scoreTone(overallResolved) === "warn"
                      ? "bg-amber-400/12 text-amber-600 ring-amber-400/25"
                      : "bg-rose-500/10 text-rose-600 ring-rose-500/20"
                )}
              >
                {scoreTone(overallResolved) === "good"
                  ? "Strong posture"
                  : scoreTone(overallResolved) === "warn"
                    ? "Improving"
                    : "Needs focus"}
              </span>
            ) : null}
          </div>
          <div className="space-y-4">
            {dims.map((d) => (
              <Bar key={d.label} label={d.label} value={d.value} color={d.color} />
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
