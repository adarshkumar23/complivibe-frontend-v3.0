"use client";

import { PieChart } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { DonutChart, type DonutSegment } from "@/components/charts/DonutChart";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import type { VendorRiskData } from "@/lib/hooks/useVendorRisk";

const tierColors: Record<string, string> = {
  critical: "#EF4444",
  high: "#F59E0B",
  medium: "#3B82F6",
  low: "#10B981"
};

/** Risk-tier distribution from GET /api/v1/compliance/vendors/summary. */
export function VendorReviewPipeline({ data }: { data: VendorRiskData }) {
  const { summary } = data;
  const byTier = summary.data?.by_risk_tier ?? {};

  const segments: DonutSegment[] = Object.entries(byTier)
    .map(([tier, count]) => ({
      label: tier,
      value: count,
      color: tierColors[tier] ?? "#94A3B8"
    }))
    .filter((s) => s.value > 0);
  const total = segments.reduce((s, x) => s + x.value, 0);

  return (
    <SectionCard title="Risk Tier Mix" subtitle="Vendor distribution by assessed tier" icon={PieChart} accent="purple">
      {summary.isLoading ? (
        <LoadingSkeleton className="mx-auto h-36 w-full" />
      ) : summary.isError ? (
        <ErrorState compact title="Unable to load tier mix" onRetry={() => summary.refetch()} />
      ) : segments.length === 0 ? (
        <EmptyState compact icon={PieChart} title="No tiered vendors" description="Vendor tier distribution will appear here." />
      ) : (
        <DonutChart segments={segments} size={130} centerLabel={String(total)} centerSub="vendors" />
      )}
    </SectionCard>
  );
}
