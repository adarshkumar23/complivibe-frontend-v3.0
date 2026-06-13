"use client";

import { Flame, ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeIncidents, isResolved } from "@/lib/api/incident-normalizers";
import { normalizeAlerts } from "@/lib/api/normalizers";
import type { Severity } from "@/lib/api/types";
import type { IncidentsData } from "@/lib/hooks/useIncidents";

type Item = { id: string; title: string; severity: Severity; description: string | null };

export function CriticalIncidents({ data }: { data: IncidentsData }) {
  const { incidents, predictive } = data;
  const list = normalizeIncidents(incidents.data);

  const critical = list.filter(
    (i) => (i.severity === "critical" || i.severity === "high") && !isResolved(i.status)
  );

  let items: Item[] = [];
  let source = "incidents";

  if (critical.length > 0) {
    items = critical.slice(0, 5).map((i) => ({ id: i.id, title: i.title, severity: i.severity, description: i.category || i.owner }));
  } else if (list.length === 0) {
    const alerts = normalizeAlerts(undefined, predictive.data).filter((a) => a.severity === "critical" || a.severity === "high");
    items = alerts.slice(0, 5).map((a) => ({ id: a.id, title: a.title, severity: a.severity, description: a.description }));
    source = "predictive alerts";
  }

  const loading = incidents.isLoading;
  const errored = incidents.isError && predictive.isError;

  return (
    <SectionCard title="Critical Incidents" subtitle={source === "predictive alerts" ? "Source: Predictive alerts" : "Open high & critical"} icon={Flame} accent="red">
      {loading ? (
        <SkeletonRows rows={4} />
      ) : errored ? (
        <ErrorState compact title="Unable to load critical incidents" onRetry={() => incidents.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState compact icon={ShieldCheck} title="No critical incidents" description="Open high and critical incidents will surface here from the register or predictive alerts." />
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl bg-white/55 p-3.5 ring-1 ring-white/70">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-semibold leading-snug text-cv-ink">{item.title}</p>
                <SeverityBadge severity={item.severity} />
              </div>
              {item.description ? <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-cv-slate">{item.description}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
