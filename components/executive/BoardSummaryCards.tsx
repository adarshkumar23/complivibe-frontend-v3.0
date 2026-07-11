"use client";

import { LayoutDashboard, FilePlus2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatRelativeTime } from "@/lib/utils/format";
import type { ExecutiveData } from "@/lib/hooks/useExecutiveSummary";

/** Board scorecard snapshots from GET /api/v1/compliance/board-scorecard. */
export function BoardSummaryCards({ data }: { data: ExecutiveData }) {
  const { scorecards } = data;
  const items = scorecards.data?.items ?? [];

  return (
    <SectionCard title="Board Scorecards" subtitle="Point-in-time compliance snapshots" icon={LayoutDashboard} accent="purple" className="h-full">
      {scorecards.isLoading ? (
        <SkeletonRows rows={4} />
      ) : scorecards.isError ? (
        <ErrorState compact title="Unable to load scorecards" onRetry={() => scorecards.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          compact
          icon={FilePlus2}
          title="No scorecards generated"
          description="Generate a board scorecard to capture a defensible compliance snapshot."
        />
      ) : (
        <ul className="space-y-2.5">
          {items.map((sc) => (
            <li key={sc.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{sc.snapshot_label ?? "Scorecard"}</p>
                <p className="text-[11px] text-cv-slate">{formatRelativeTime(sc.created_at)}</p>
              </div>
              {sc.overall_compliance_score != null ? (
                <StatusBadge
                  label={`${Math.round(sc.overall_compliance_score)}`}
                  tone={sc.overall_compliance_score >= 70 ? "good" : sc.overall_compliance_score >= 40 ? "warn" : "bad"}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
