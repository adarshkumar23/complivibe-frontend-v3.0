"use client";

import { PieChart } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { DonutChart, type DonutSegment } from "@/components/charts/DonutChart";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import type { AiSystemsData } from "@/lib/hooks/useAiSystems";

const tierColors: Record<string, string> = {
  critical: "#EF4444",
  high: "#F59E0B",
  medium: "#3B82F6",
  low: "#10B981",
  unassessed: "#94A3B8"
};

/** Risk-tier distribution from GET /api/v1/ai-governance/dashboard. */
export function RiskDistribution({ data }: { data: AiSystemsData }) {
  const { dashboard } = data;
  const byTier = dashboard.data?.ai_systems_by_tier ?? {};
  // When the tier aggregation failed server-side, byTier is an all-zero
  // placeholder — surface it as unavailable, not an empty "No systems" donut.
  const tierUnavailable = (dashboard.data?.unavailable_metrics ?? []).includes("ai_systems_by_tier");

  const segments: DonutSegment[] = Object.entries(byTier)
    .map(([tier, count]) => ({ label: tier, value: count, color: tierColors[tier] ?? "#94A3B8" }))
    .filter((s) => s.value > 0);
  const total = segments.reduce((s, x) => s + x.value, 0);
  const unassessed = byTier["unassessed"] ?? 0;

  return (
    <SectionCard title="Risk Tier Distribution" subtitle="AI systems by assessed governance tier" icon={PieChart} accent="red">
      {dashboard.isLoading ? (
        <LoadingSkeleton className="mx-auto h-36 w-full" />
      ) : dashboard.isError ? (
        <ErrorState compact title="Unable to load tier distribution" onRetry={() => dashboard.refetch()} />
      ) : tierUnavailable ? (
        <ErrorState compact title="Tier distribution unavailable" onRetry={() => dashboard.refetch()} />
      ) : segments.length === 0 ? (
        <EmptyState compact icon={PieChart} title="No systems yet" description="Tier distribution will appear here." />
      ) : (
        <>
          <DonutChart segments={segments} size={130} centerLabel={String(total)} centerSub="systems" />
          {unassessed > 0 ? (
            <p className="mt-2 text-center text-[11px] font-medium text-amber-600">
              {unassessed} system{unassessed === 1 ? "" : "s"} unassessed — tier them to see true exposure.
            </p>
          ) : null}
        </>
      )}
    </SectionCard>
  );
}
