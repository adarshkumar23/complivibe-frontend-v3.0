"use client";

import { FileCheck2, FolderOpen } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { DonutChart, type DonutSegment } from "@/components/charts/DonutChart";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { normalizeEvidence } from "@/lib/api/normalizers";
import type { CommandCenter } from "@/lib/hooks/useCommandCenter";

export function EvidenceFreshness({ data }: { data: CommandCenter }) {
  const { evidence } = data;
  const summary = normalizeEvidence(evidence.data);

  const segments: DonutSegment[] = [
    { label: "Fresh", value: summary.freshCount ?? 0, color: "#10B981" },
    { label: "Stale", value: summary.staleCount ?? 0, color: "#F59E0B" },
    { label: "Expired", value: summary.expiredCount ?? 0, color: "#EF4444" }
  ].filter((s) => s.value > 0);

  const hasBreakdown = segments.length > 0;
  const hasTotal = summary.totalCount > 0;

  return (
    <SectionCard title="Evidence Freshness" subtitle="Audit-ready chain of custody" icon={FileCheck2} accent="green">
      {evidence.isLoading ? (
        <LoadingSkeleton className="mx-auto h-36 w-full" />
      ) : evidence.isError ? (
        <ErrorState compact title="Unable to load evidence" onRetry={() => evidence.refetch()} />
      ) : hasBreakdown ? (
        <DonutChart segments={segments} size={130} centerLabel={String(summary.totalCount)} centerSub="items" />
      ) : hasTotal ? (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <span className="text-4xl font-extrabold text-cv-ink">{summary.totalCount}</span>
          <span className="mt-1 text-xs font-medium text-cv-slate">evidence items tracked</span>
          <span className="mt-3 rounded-full bg-slate-400/10 px-3 py-1 text-[11px] font-semibold text-cv-slate ring-1 ring-slate-400/15">
            Freshness breakdown unavailable
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
