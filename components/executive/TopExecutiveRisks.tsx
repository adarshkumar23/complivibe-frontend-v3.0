"use client";

import { Flame, CheckCircle2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import type { Severity } from "@/lib/api/types";
import type { ExecutiveData } from "@/lib/hooks/useExecutiveSummary";

/** Board-level risk view: top open risks by inherent score. */
export function TopExecutiveRisks({ data }: { data: ExecutiveData }) {
  const { risks } = data;
  const top = (risks.data ?? [])
    .filter((r) => r.status !== "mitigated" && r.status !== "closed")
    .sort((a, b) => (b.inherent_score ?? 0) - (a.inherent_score ?? 0))
    .slice(0, 5);

  return (
    <SectionCard title="Top Risks" subtitle="Highest exposure for board attention" icon={Flame} accent="red" className="h-full">
      {risks.isLoading ? (
        <SkeletonRows rows={4} />
      ) : risks.isError ? (
        <ErrorState compact title="Unable to load risks" onRetry={() => risks.refetch()} />
      ) : top.length === 0 ? (
        <EmptyState compact icon={CheckCircle2} title="No open risks" description="The register has no open risks." />
      ) : (
        <ul className="space-y-2.5">
          {top.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold leading-snug text-cv-ink">{r.title}</p>
                <p className="text-[11px] text-cv-slate">
                  {[r.category?.replaceAll("_", " "), r.treatment_strategy ? `treatment: ${r.treatment_strategy}` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {r.inherent_score != null ? (
                  <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-bold text-rose-600 ring-1 ring-rose-500/20">
                    {r.inherent_score}
                  </span>
                ) : null}
                {r.severity ? <SeverityBadge severity={r.severity as Severity} /> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
