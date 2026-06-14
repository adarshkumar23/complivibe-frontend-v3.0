"use client";

import { Bell, BellOff } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeAlerts } from "@/lib/api/normalizers";
import { normalizeIncidents, isResolved } from "@/lib/api/incident-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { Severity } from "@/lib/api/types";
import type { AiMonitoringData } from "@/lib/hooks/useAiMonitoring";

const order: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
type Item = { id: string; title: string; severity: Severity; hasSeverity: boolean; kind: string; timestamp: string | null };

export function AlertsIncidentsFeed({ data }: { data: AiMonitoringData }) {
  const { alerts, incidents } = data;

  const alertItems: Item[] = normalizeAlerts(undefined, alerts.data).map((a) => ({
    id: `a-${a.id}`, title: a.title, severity: a.severity, hasSeverity: a.hasSeverity, kind: "Alert", timestamp: a.timestamp
  }));
  const incItems: Item[] = normalizeIncidents(incidents.data)
    .filter((i) => !isResolved(i.status))
    .map((i) => ({ id: `i-${i.id}`, title: i.title, severity: i.severity, hasSeverity: i.hasSeverity, kind: "Incident", timestamp: i.createdAt ?? null }));

  const combined = [...alertItems, ...incItems].sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 10);

  const loading = alerts.isLoading || incidents.isLoading;
  const errored = alerts.isError && incidents.isError;

  return (
    <SectionCard title="Alerts & Incidents" subtitle="Predictive alerts and open incidents" icon={Bell} accent="amber" className="h-full">
      {loading ? (
        <SkeletonRows rows={5} />
      ) : errored ? (
        <ErrorState compact title="Unable to load alerts" onRetry={() => alerts.refetch()} />
      ) : combined.length === 0 ? (
        <EmptyState icon={BellOff} title="No alerts or incidents" description="Predictive alerts and open incidents will stream here once the backend reports them." />
      ) : (
        <ul className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
          {combined.map((it) => {
            const time = formatRelativeTime(it.timestamp);
            return (
              <li key={it.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-cv-ink">{it.title}</p>
                  <p className="text-[11px] font-medium text-cv-mist">{[it.kind, time].filter(Boolean).join(" · ")}</p>
                </div>
                {it.hasSeverity ? (
                  <SeverityBadge severity={it.severity} />
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-400/10 px-2.5 py-1 text-xs font-semibold text-cv-slate ring-1 ring-slate-400/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                    Unclassified
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
