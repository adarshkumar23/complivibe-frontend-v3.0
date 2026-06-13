"use client";

import { Timer, AlarmClockOff } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { normalizeIncidents, averageResolutionHours, formatDurationHours, isSlaBreached } from "@/lib/api/incident-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { IncidentsData } from "@/lib/hooks/useIncidents";

export function SlaResolution({ data }: { data: IncidentsData }) {
  const { incidents } = data;
  const list = normalizeIncidents(incidents.data);

  const avgHours = averageResolutionHours(list);
  const anyDue = list.some((i) => i.dueDate);
  const breaches = list.filter(isSlaBreached);
  const hasData = avgHours != null || anyDue;

  return (
    <SectionCard title="SLA & Resolution" subtitle="Time-to-resolve & SLA health" icon={Timer} accent="teal">
      {incidents.isLoading ? (
        <LoadingSkeleton className="h-36 w-full" />
      ) : incidents.isError ? (
        <ErrorState compact title="Unable to load incidents" onRetry={() => incidents.refetch()} />
      ) : !hasData ? (
        <EmptyState compact icon={Timer} title="Resolution data unavailable" description="Resolution time and SLA breaches need real detected, resolved, or SLA-due timestamps." />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex items-center gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
              <IconTile icon={Timer} accent="teal" size="sm" />
              <div>
                <p className={`text-lg font-extrabold leading-none ${avgHours != null ? "text-cv-ink" : "text-cv-mist"}`}>
                  {avgHours != null ? formatDurationHours(avgHours) : "—"}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-cv-slate">Avg resolution</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
              <IconTile icon={AlarmClockOff} accent="red" size="sm" />
              <div>
                <p className={`text-lg font-extrabold leading-none ${anyDue ? "text-cv-ink" : "text-cv-mist"}`}>
                  {anyDue ? breaches.length : "—"}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-cv-slate">SLA breaches</p>
              </div>
            </div>
          </div>
          {breaches.length > 0 ? (
            <ul className="space-y-2">
              {breaches.slice(0, 4).map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2 ring-1 ring-white/60">
                  <p className="truncate text-[13px] font-semibold text-cv-ink">{i.title}</p>
                  <StatusBadge label={`Due ${formatDate(i.dueDate) ?? ""}`.trim()} tone="bad" />
                </li>
              ))}
            </ul>
          ) : anyDue ? (
            <p className="text-center text-[12px] font-medium text-emerald-600">No SLA breaches — all within due dates.</p>
          ) : null}
        </div>
      )}
    </SectionCard>
  );
}
