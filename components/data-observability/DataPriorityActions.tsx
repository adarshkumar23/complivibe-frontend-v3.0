"use client";

import { Target, CheckCircle2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import {
  dataPriorityActions,
  normalizePipelines,
  normalizeSources,
  sensitiveSignals
} from "@/lib/api/data-observability-normalizers";
import type { DataObservability } from "@/lib/hooks/useDataObservability";

export function DataPriorityActions({ data }: { data: DataObservability }) {
  const { overview, pipelines, sources, sensitive } = data;
  const actions = dataPriorityActions(
    overview.data,
    normalizePipelines(pipelines.data),
    normalizeSources(sources.data),
    sensitiveSignals(sensitive.data)
  ).slice(0, 6);

  const loading = overview.isLoading || pipelines.isLoading || sources.isLoading;
  const errored = overview.isError && pipelines.isError && sources.isError;

  return (
    <SectionCard title="Priority Actions" subtitle="Issues that need attention" icon={Target} accent="red" className="h-full">
      {loading ? (
        <SkeletonRows rows={4} />
      ) : errored ? (
        <ErrorState title="Unable to load priority actions" onRetry={() => overview.refetch()} />
      ) : actions.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No priority issues"
          description="Stale datasets, failed pipelines, schema drift, and access anomalies will surface here."
        />
      ) : (
        <ul className="space-y-2.5">
          {actions.map((a) => (
            <li key={a.id} className="rounded-2xl bg-white/55 p-3.5 ring-1 ring-white/70 transition hover:bg-white/80">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-semibold leading-snug text-cv-ink">{a.title}</p>
                <SeverityBadge severity={a.severity} />
              </div>
              {a.description ? (
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-cv-slate">{a.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
