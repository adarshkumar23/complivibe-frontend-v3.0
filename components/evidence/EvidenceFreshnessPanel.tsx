"use client";

import { Clock4, CalendarOff } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { DonutChart, type DonutSegment } from "@/components/charts/DonutChart";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { normalizeEvidenceItems, freshnessSummary } from "@/lib/api/evidence-normalizers";
import type { EvidenceData } from "@/lib/hooks/useEvidence";

export function EvidenceFreshnessPanel({ data }: { data: EvidenceData }) {
  const { evidence } = data;
  const items = normalizeEvidenceItems(evidence.data);
  const summary = freshnessSummary(items);

  const segments: DonutSegment[] = [
    { label: "Fresh", value: summary.fresh, color: "#10B981" },
    { label: "Expiring", value: summary.expiring, color: "#F59E0B" },
    { label: "Expired", value: summary.expired, color: "#EF4444" }
  ].filter((s) => s.value > 0);

  return (
    <SectionCard title="Evidence Freshness" subtitle="Validity across the vault" icon={Clock4} accent="green" className="h-full">
      {evidence.isLoading ? (
        <LoadingSkeleton className="mx-auto h-36 w-full" />
      ) : evidence.isError ? (
        <ErrorState compact title="Unable to load evidence" onRetry={() => evidence.refetch()} />
      ) : !summary.hasSignal || segments.length === 0 ? (
        <EmptyState
          compact
          icon={CalendarOff}
          title="Freshness unavailable"
          description="Freshness needs a status field or expiry/updated dates on evidence records."
        />
      ) : (
        <DonutChart
          segments={segments}
          size={132}
          centerLabel={String(summary.fresh + summary.expiring + summary.expired)}
          centerSub="dated"
        />
      )}
    </SectionCard>
  );
}
