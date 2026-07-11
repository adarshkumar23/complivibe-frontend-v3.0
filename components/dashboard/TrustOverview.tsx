"use client";

import { History, Activity } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { formatRelativeTime } from "@/lib/utils/format";
import type { CommandCenterData } from "@/lib/hooks/useCommandCenter";

/** Unified compliance timeline from GET /api/v1/compliance-timeline. */
export function TrustOverview({ data }: { data: CommandCenterData }) {
  const { timeline } = data;
  const events = (timeline.data?.events ?? []).slice(0, 10);

  return (
    <SectionCard
      title="Compliance Timeline"
      subtitle="Everything that changed, in order"
      icon={History}
      accent="blue"
      className="h-full"
      action={
        timeline.data ? (
          <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
            {timeline.data.total_events} events
          </span>
        ) : null
      }
    >
      {timeline.isLoading ? (
        <SkeletonRows rows={6} />
      ) : timeline.isError ? (
        <ErrorState title="Unable to load timeline" onRetry={() => timeline.refetch()} />
      ) : events.length === 0 ? (
        <EmptyState icon={Activity} title="No events yet" description="Risk, policy, and control events will stream here." />
      ) : (
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={e.event_key} className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cv-brand" />
              <div className="min-w-0">
                <p className="line-clamp-2 text-[13px] font-medium text-cv-ink">{e.title ?? e.event_type.replaceAll("_", " ")}</p>
                <p className="text-[11px] text-cv-mist">
                  {[e.event_type.replaceAll("_", " "), formatRelativeTime(e.occurred_at)].filter(Boolean).join(" · ")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
