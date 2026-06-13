"use client";

import { Activity, ListChecks } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { normalizeIncidents, statusOverview, type StatusKey } from "@/lib/api/incident-normalizers";
import type { IncidentsData } from "@/lib/hooks/useIncidents";

const color: Record<StatusKey, string> = {
  Open: "#F59E0B",
  Investigating: "#3B82F6",
  Mitigating: "#06B6D4",
  Resolved: "#10B981",
  Closed: "#14B8A6",
  Other: "#8B5CF6"
};

export function IncidentStatusOverview({ data }: { data: IncidentsData }) {
  const { incidents } = data;
  const list = normalizeIncidents(incidents.data);
  const { buckets, hasStatus } = statusOverview(list);
  const max = buckets.reduce((m, b) => Math.max(m, b.value), 0) || 1;

  return (
    <SectionCard title="Incident Status Overview" subtitle="Lifecycle distribution" icon={Activity} accent="cyan" className="h-full">
      {incidents.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : incidents.isError ? (
        <ErrorState title="Unable to load incidents" onRetry={() => incidents.refetch()} />
      ) : !hasStatus ? (
        <EmptyState icon={ListChecks} title="No status data" description="Open, investigating, mitigating, resolved, and closed counts appear here once incidents carry a status." />
      ) : (
        <ul className="space-y-3.5">
          {buckets.map((b) => (
            <li key={b.label}>
              <div className="mb-1.5 flex items-center justify-between text-[13px]">
                <span className="font-semibold text-cv-ink">{b.label}</span>
                <span className="font-bold text-cv-ink">{b.value}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-400/12">
                <div className="h-full rounded-full" style={{ width: `${Math.max(4, (b.value / max) * 100)}%`, background: color[b.label] }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
