"use client";

import { ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { ScoreRing } from "@/components/charts/ScoreRing";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { pickScore } from "@/lib/hooks/useCommandCenter";
import { scoreTone } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { TrustCenterData } from "@/lib/hooks/useTrustCenter";

const DIMENSIONS: { label: string; paths: string[]; color: string }[] = [
  { label: "Governance", paths: ["governance_score", "ai_governance", "governance"], color: "#8B5CF6" },
  { label: "Compliance", paths: ["compliance_score", "compliance_readiness", "compliance"], color: "#3B82F6" },
  { label: "Audit readiness", paths: ["audit_readiness", "audit_score", "audit"], color: "#14B8A6" },
  { label: "Security", paths: ["security_score", "security", "security_posture"], color: "#06B6D4" }
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
          <div className="h-full rounded-full" style={{ width: `${Math.max(4, Math.min(100, value!))}%`, background: color }} />
        ) : (
          <div className="h-full w-full bg-[repeating-linear-gradient(90deg,rgba(148,163,184,0.25)_0_8px,transparent_8px_16px)]" />
        )}
      </div>
    </div>
  );
}

export function TrustOverview({ data }: { data: TrustCenterData }) {
  const { trust, metrics, scores, executive } = data;
  const sources = [trust.data, metrics.data, scores.data, executive.data];
  const loading = trust.isLoading && scores.isLoading && executive.isLoading;

  const overall = pickScore(sources, ["trust_score", "overall_score", "trust", "score"]);
  const dims = DIMENSIONS.map((d) => ({ ...d, value: pickScore(sources, d.paths) }));
  const overallResolved =
    overall ??
    (dims.some((d) => d.value != null)
      ? Math.round(dims.filter((d) => d.value != null).reduce((s, d) => s + (d.value as number), 0) / dims.filter((d) => d.value != null).length)
      : null);
  const hasAny = overallResolved != null || dims.some((d) => d.value != null);

  return (
    <SectionCard title="Trust Overview" subtitle="What customers can trust" icon={ShieldCheck} accent="purple" className="h-full">
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <LoadingSkeleton className="mx-auto h-40 w-40 rounded-full" />
          <div className="space-y-4">
            {DIMENSIONS.map((d) => (
              <LoadingSkeleton key={d.label} className="h-8 w-full" />
            ))}
          </div>
        </div>
      ) : !hasAny ? (
        <EmptyState icon={ShieldCheck} title="No trust signals yet" description="Trust, governance, compliance, audit, and security scores will appear here once your backend reports them." />
      ) : (
        <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center">
            <ScoreRing value={overallResolved} size={150} label="Trust score" />
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
                {scoreTone(overallResolved) === "good" ? "Strong posture" : scoreTone(overallResolved) === "warn" ? "Improving" : "Needs focus"}
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
