"use client";

import { Wrench, ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeIncidents } from "@/lib/api/incident-normalizers";
import type { IncidentsData } from "@/lib/hooks/useIncidents";

export function ResponseActions({ data }: { data: IncidentsData }) {
  const { incidents } = data;
  const list = normalizeIncidents(incidents.data);
  const withAction = list.filter((i) => i.action).slice(0, 6);
  const anyIncidents = list.length > 0;

  return (
    <SectionCard title="Response Actions" subtitle="Remediation & next steps" icon={Wrench} accent="teal">
      {incidents.isLoading ? (
        <SkeletonRows rows={4} />
      ) : incidents.isError ? (
        <ErrorState compact title="Unable to load actions" onRetry={() => incidents.refetch()} />
      ) : !anyIncidents ? (
        <EmptyState compact icon={ShieldCheck} title="No incidents recorded" description="Response actions appear here once incidents are reported." />
      ) : withAction.length === 0 ? (
        <EmptyState compact icon={Wrench} title="No response action returned by backend" description="Incidents exist but none include a remediation or next-step field." />
      ) : (
        <ul className="space-y-2.5">
          {withAction.map((i) => (
            <li key={i.id} className="rounded-2xl bg-white/55 p-3.5 ring-1 ring-white/70">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-semibold leading-snug text-cv-ink">{i.title}</p>
                {i.hasSeverity ? <SeverityBadge severity={i.severity} /> : null}
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-cv-slate">{i.action}</p>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
