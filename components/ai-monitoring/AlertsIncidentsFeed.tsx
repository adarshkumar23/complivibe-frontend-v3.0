"use client";

import { Activity } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import type { AiMonitoringData } from "@/lib/hooks/useAiMonitoring";

const barColors = ["#3B82F6", "#8B5CF6", "#14B8A6", "#F59E0B", "#EF4444"];

/** 30-day event mix from GET /api/v1/ai-governance/events/summary. */
export function AlertsIncidentsFeed({ data }: { data: AiMonitoringData }) {
  const { events } = data;
  const byType = events.data?.by_event_type ?? {};
  const entries = Object.entries(byType).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, n]) => s + n, 0);

  return (
    <SectionCard title="Event Mix (30d)" subtitle="Governance events by type" icon={Activity} accent="purple">
      {events.isLoading ? (
        <SkeletonRows rows={4} />
      ) : events.isError ? (
        <ErrorState compact title="Unable to load events" onRetry={() => events.refetch()} />
      ) : entries.length === 0 ? (
        <EmptyState
          compact
          icon={Activity}
          title="No events in the last 30 days"
          description="Reviews, approvals, and lifecycle changes will chart here."
        />
      ) : (
        <ul className="space-y-3">
          {entries.map(([type, count], i) => (
            <li key={type}>
              <div className="mb-1 flex items-center justify-between text-[12px]">
                <span className="font-semibold text-cv-ink">{type.replaceAll("_", " ")}</span>
                <span className="font-medium text-cv-slate">{count}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-400/12">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(6, (count / total) * 100)}%`, background: barColors[i % barColors.length] }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
