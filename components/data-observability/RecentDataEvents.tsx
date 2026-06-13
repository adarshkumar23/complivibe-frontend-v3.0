"use client";

import { Activity, History } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeDataEvents } from "@/lib/api/data-observability-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { DataObservability } from "@/lib/hooks/useDataObservability";

export function RecentDataEvents({ data }: { data: DataObservability }) {
  const { overview, freshness, pipelines } = data;
  const events = normalizeDataEvents(overview.data, freshness.data, pipelines.data).slice(0, 5);
  const loading = overview.isLoading || freshness.isLoading;
  const errored = overview.isError && freshness.isError && pipelines.isError;

  return (
    <SectionCard title="Recent Data Events" subtitle="Latest data signals & activity" icon={History} accent="cyan">
      {loading ? (
        <SkeletonRows rows={4} />
      ) : errored ? (
        <ErrorState compact title="Unable to load events" onRetry={() => overview.refetch()} />
      ) : events.length === 0 ? (
        <EmptyState
          compact
          icon={Activity}
          title="No recent data events"
          description="Data freshness, pipeline, and quality events will stream here as they happen."
        />
      ) : (
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={e.id} className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cv-brand" />
              <div className="min-w-0">
                <p className="line-clamp-2 text-[13px] font-medium text-cv-ink">{e.title}</p>
                <p className="text-[11px] text-cv-mist">
                  {[e.type, e.source, formatRelativeTime(e.timestamp)].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
