"use client";

import { FileBarChart, Clock, Archive, LayoutDashboard } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import type { ReportsData } from "@/lib/hooks/useReports";

export function ReportKpis({ data }: { data: ReportsData }) {
  const { summary, scorecards } = data;
  const s = summary.data;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi
        label="Reports"
        icon={FileBarChart}
        accent="blue"
        value={s ? s.total_reports : null}
        caption={s ? `${s.generated_reports} generated` : undefined}
        loading={summary.isLoading}
        unavailableHint="Report summary unavailable"
      />
      <RegistryKpi
        label="Generated (30d)"
        icon={Clock}
        accent="teal"
        value={s ? s.reports_last_30d : null}
        caption={s && s.reports_last_30d === 0 ? "no recent reporting activity" : undefined}
        loading={summary.isLoading}
        unavailableHint="Report summary unavailable"
      />
      <RegistryKpi
        label="Stale (>30d)"
        icon={Archive}
        accent="amber"
        value={s ? s.stale_reports_30d : null}
        caption={s && s.stale_reports_30d > 0 ? "regenerate before sharing" : undefined}
        loading={summary.isLoading}
        unavailableHint="Report summary unavailable"
      />
      <RegistryKpi
        label="Board Scorecards"
        icon={LayoutDashboard}
        accent="purple"
        value={scorecards.data ? scorecards.data.total : null}
        caption={scorecards.data && scorecards.data.total === 0 ? "generate the first board snapshot" : undefined}
        loading={scorecards.isLoading}
        unavailableHint="Scorecards unavailable"
      />
    </div>
  );
}
