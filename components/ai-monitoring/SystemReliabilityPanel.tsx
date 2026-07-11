"use client";

import { Server } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AiMonitoringData } from "@/lib/hooks/useAiMonitoring";

/** Noisiest systems from GET /api/v1/ai-governance/events/summary. */
export function SystemReliabilityPanel({ data }: { data: AiMonitoringData }) {
  const { events } = data;
  const systems = events.data?.systems_with_most_events ?? [];

  return (
    <SectionCard title="Noisiest Systems" subtitle="Systems generating the most governance events" icon={Server} accent="teal">
      {events.isLoading ? (
        <SkeletonRows rows={3} />
      ) : events.isError ? (
        <ErrorState compact title="Unable to load system activity" onRetry={() => events.refetch()} />
      ) : systems.length === 0 ? (
        <EmptyState
          compact
          icon={Server}
          title="No per-system activity yet"
          description="Systems with frequent governance events will rank here."
        />
      ) : (
        <ul className="space-y-2.5">
          {systems.slice(0, 6).map((s, i) => (
            <li key={s.system_id ?? i} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <span className="truncate text-[13px] font-semibold text-cv-ink">{s.system_name ?? s.system_id ?? "Unknown system"}</span>
              <StatusBadge label={`${s.count ?? 0} events`} tone={i === 0 ? "warn" : "neutral"} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
