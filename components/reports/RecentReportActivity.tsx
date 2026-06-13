"use client";

import { History, Activity } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeReports, reportActivity } from "@/lib/api/report-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { ReportsData } from "@/lib/hooks/useReports";

export function RecentReportActivity({ data }: { data: ReportsData }) {
  const { reports } = data;
  const list = normalizeReports(reports.data);
  const events = reportActivity(list).slice(0, 6);

  return (
    <SectionCard title="Recent Report Activity" subtitle="Latest generations & exports" icon={History} accent="cyan" className="h-full">
      {reports.isLoading ? (
        <SkeletonRows rows={4} />
      ) : reports.isError ? (
        <ErrorState compact title="Unable to load activity" onRetry={() => reports.refetch()} />
      ) : events.length === 0 ? (
        <EmptyState compact icon={Activity} title="No dated report activity" description="Report generation and export events appear here when records include timestamps." />
      ) : (
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={`${e.id}-${e.timestamp}`} className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cv-brand" />
              <div className="min-w-0">
                <p className="line-clamp-2 text-[13px] font-medium text-cv-ink">
                  <span className="font-semibold">{e.action}:</span> {e.title}
                </p>
                <p className="text-[11px] text-cv-mist">
                  {[e.status, formatRelativeTime(e.timestamp)].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
