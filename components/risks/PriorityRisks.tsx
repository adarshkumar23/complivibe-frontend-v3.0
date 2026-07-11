"use client";

import { Flame, CheckCircle2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import type { Severity } from "@/lib/api/types";
import type { RisksData } from "@/lib/hooks/useRisks";

/** Top open risks by inherent score, with the reason they need attention. */
export function PriorityRisks({ data }: { data: RisksData }) {
  const { risks } = data;
  const top = (risks.data ?? [])
    .filter((r) => r.status !== "mitigated" && r.status !== "accepted" && r.status !== "closed")
    .sort((a, b) => (b.inherent_score ?? 0) - (a.inherent_score ?? 0))
    .slice(0, 5);

  return (
    <SectionCard title="Priority Risks" subtitle="Highest inherent exposure, still untreated" icon={Flame} accent="red" className="h-full">
      {risks.isLoading ? (
        <SkeletonRows rows={4} />
      ) : risks.isError ? (
        <ErrorState compact title="Unable to load risks" onRetry={() => risks.refetch()} />
      ) : top.length === 0 ? (
        <EmptyState compact icon={CheckCircle2} title="No open risks" description="All registered risks are mitigated, accepted, or closed." />
      ) : (
        <ul className="space-y-2.5">
          {top.map((r) => {
            const reasons: string[] = [];
            if (r.residual_score != null && r.inherent_score != null && r.residual_score === r.inherent_score) {
              reasons.push("treatment not yet reducing residual score");
            }
            if (!r.owner_user_id) reasons.push("no owner");
            if (r.target_date) {
              const days = Math.ceil((new Date(r.target_date).getTime() - Date.now()) / 86400000);
              if (days < 0) reasons.push(`target date missed by ${Math.abs(days)}d`);
              else reasons.push(`target in ${days}d`);
            }
            return (
              <li key={r.id} className="rounded-2xl bg-white/55 p-3.5 ring-1 ring-white/70">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] font-semibold leading-snug text-cv-ink">{r.title}</p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {r.inherent_score != null ? (
                      <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-bold text-rose-600 ring-1 ring-rose-500/20">
                        {r.inherent_score}
                      </span>
                    ) : null}
                    {r.severity ? <SeverityBadge severity={r.severity as Severity} /> : null}
                  </div>
                </div>
                {reasons.length > 0 ? (
                  <p className="mt-1 text-xs leading-relaxed text-cv-slate">{reasons.join(" · ")}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
