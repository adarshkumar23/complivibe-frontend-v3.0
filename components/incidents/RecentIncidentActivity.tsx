"use client";

import { History, Activity } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeIncidents, incidentActivity } from "@/lib/api/incident-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { IncidentsData } from "@/lib/hooks/useIncidents";

export function RecentIncidentActivity({ data }: { data: IncidentsData }) {
  const { incidents } = data;
  const list = normalizeIncidents(incidents.data);
  const events = incidentActivity(list).slice(0, 6);

  return (
    <SectionCard title="Recent Incident Activity" subtitle="Latest detections & resolutions" icon={History} accent="cyan">
      {incidents.isLoading ? (
        <SkeletonRows rows={4} />
      ) : incidents.isError ? (
        <ErrorState compact title="Unable to load activity" onRetry={() => incidents.refetch()} />
      ) : events.length === 0 ? (
        <EmptyState compact icon={Activity} title="No dated incident activity" description="Detection and resolution events appear here when incidents include timestamps." />
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
