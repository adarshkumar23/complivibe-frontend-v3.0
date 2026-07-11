"use client";

import { FileBarChart, FilePlus2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { formatRelativeTime } from "@/lib/utils/format";
import type { ReportsData } from "@/lib/hooks/useReports";

/** Generated reports from GET /api/v1/reports. */
export function ReportLibrary({ data }: { data: ReportsData }) {
  const { reports } = data;
  const list = reports.data?.reports ?? [];

  return (
    <SectionCard
      title="Report Library"
      subtitle="Generated compliance reports"
      icon={FileBarChart}
      accent="blue"
      className="h-full"
      action={
        reports.isSuccess ? (
          <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
            {list.length} reports
          </span>
        ) : null
      }
    >
      {reports.isLoading ? (
        <SkeletonRows rows={5} />
      ) : reports.isError ? (
        <ErrorState title="Unable to load reports" onRetry={() => reports.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={FilePlus2}
          title="No reports generated"
          description="Generate an executive summary, framework readiness, or regulatory report to populate the library."
        />
      ) : (
        <ul className="space-y-2.5">
          {list.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold leading-snug text-cv-ink">
                  {(r.title as string) || (r.report_type ?? "report").replaceAll("_", " ")}
                </p>
                <p className="mt-0.5 text-[11px] text-cv-slate">
                  {[r.report_type ? String(r.report_type).replaceAll("_", " ") : null, r.created_at ? formatRelativeTime(String(r.created_at)) : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              {r.status ? <StatusBadge label={String(r.status)} tone={r.status === "generated" ? "good" : "info"} /> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
