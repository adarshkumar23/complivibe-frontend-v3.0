"use client";

import { FileCheck2, FolderOpen } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { DonutChart, type DonutSegment } from "@/components/charts/DonutChart";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import type { Compliance } from "@/lib/hooks/useCompliance";

/** Evidence health from posture-summary.evidence (verified / needs_review / expired). */
export function ComplianceEvidenceFreshness({ data }: { data: Compliance }) {
  const { posture } = data;
  const ev = posture.data?.evidence;

  const segments: DonutSegment[] = ev
    ? [
        { label: "Verified", value: ev.verified, color: "#10B981" },
        { label: "Needs review", value: ev.needs_review, color: "#F59E0B" },
        { label: "Expired", value: ev.expired, color: "#EF4444" }
      ].filter((s) => s.value > 0)
    : [];

  const expiredNote =
    ev && ev.expired > 0
      ? `${ev.expired} expired item${ev.expired === 1 ? "" : "s"} weaken the controls they support — recollect first.`
      : null;

  return (
    <SectionCard title="Evidence Freshness" subtitle="Audit-ready chain of custody" icon={FileCheck2} accent="green">
      {posture.isLoading ? (
        <LoadingSkeleton className="mx-auto h-36 w-full" />
      ) : posture.isError ? (
        <ErrorState compact title="Unable to load evidence summary" onRetry={() => posture.refetch()} />
      ) : ev && segments.length > 0 ? (
        <>
          <DonutChart segments={segments} size={130} centerLabel={String(ev.total)} centerSub="items" />
          {expiredNote ? <p className="mt-2 text-center text-[11px] font-medium text-rose-600">{expiredNote}</p> : null}
        </>
      ) : ev && ev.total > 0 ? (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <span className="text-4xl font-extrabold text-cv-ink">{ev.total}</span>
          <span className="mt-1 text-xs font-medium text-cv-slate">evidence items tracked</span>
          <span className="mt-3 rounded-full bg-slate-400/10 px-3 py-1 text-[11px] font-semibold text-cv-slate ring-1 ring-slate-400/15">
            None verified, expired, or flagged for review yet
          </span>
        </div>
      ) : (
        <EmptyState
          compact
          icon={FolderOpen}
          title="No evidence uploaded"
          description="Upload your first evidence file to start building an audit-ready record."
        />
      )}
    </SectionCard>
  );
}
