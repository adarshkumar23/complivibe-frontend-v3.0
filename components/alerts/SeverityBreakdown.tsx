"use client";

import { PieChart, BellOff } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { DonutChart } from "@/components/charts/DonutChart";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { buildAlertFeed, severityBreakdown } from "@/lib/api/alert-normalizers";
import type { AlertsData } from "@/lib/hooks/useAlerts";

export function SeverityBreakdown({ data }: { data: AlertsData }) {
  const { insights, predictive } = data;
  const buckets = severityBreakdown(buildAlertFeed(insights.data, predictive.data));
  const loading = insights.isLoading && predictive.isLoading;
  const errored = insights.isError && predictive.isError;

  return (
    <SectionCard title="Severity Breakdown" subtitle="Alerts by severity" icon={PieChart} accent="red" className="h-full">
      {loading ? (
        <LoadingSkeleton className="mx-auto h-36 w-full" />
      ) : errored ? (
        <ErrorState compact title="Unable to load alerts" onRetry={() => insights.refetch()} />
      ) : buckets.length === 0 ? (
        <EmptyState compact icon={BellOff} title="No alerts to chart" description="A severity breakdown will appear once alerts are reported." />
      ) : (
        <DonutChart segments={buckets} size={132} centerSub="alerts" />
      )}
    </SectionCard>
  );
}
