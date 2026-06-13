"use client";

import { Gauge } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { qualityMetrics } from "@/lib/api/data-observability-normalizers";
import { scoreTone } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { DataObservability } from "@/lib/hooks/useDataObservability";

const toneColor = { good: "#10B981", warn: "#F59E0B", bad: "#EF4444" } as const;

export function DataQuality({ data }: { data: DataObservability }) {
  const { quality, freshness, overview } = data;
  const metrics = qualityMetrics(quality.data, freshness.data, overview.data);
  const hasAny = metrics.some((m) => m.value != null);
  const loading = quality.isLoading && freshness.isLoading && overview.isLoading;
  const errored = quality.isError && freshness.isError && overview.isError;

  return (
    <SectionCard title="Data Quality & Freshness" subtitle="Reliability across key dimensions" icon={Gauge} accent="teal" className="h-full">
      {loading ? (
        <div className="space-y-4">
          {metrics.map((m) => (
            <LoadingSkeleton key={m.label} className="h-9 w-full" />
          ))}
        </div>
      ) : errored ? (
        <ErrorState title="Unable to load quality metrics" onRetry={() => quality.refetch()} />
      ) : !hasAny ? (
        <EmptyState
          icon={Gauge}
          title="No quality metrics yet"
          description="Completeness, accuracy, consistency, freshness, and schema stability will appear here once reported."
        />
      ) : (
        <ul className="space-y-4">
          {metrics.map((m) => {
            const has = m.value != null;
            const tone = scoreTone(m.value);
            return (
              <li key={m.label}>
                <div className="mb-1.5 flex items-center justify-between text-[13px]">
                  <span className="font-semibold text-cv-ink">{m.label}</span>
                  <span className={cn("font-bold", has ? "text-cv-ink" : "text-cv-mist")}>
                    {has ? `${Math.round(m.value!)}%` : "—"}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-400/12">
                  {has ? (
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(4, Math.min(100, m.value!))}%`, background: toneColor[tone] }}
                    />
                  ) : (
                    <div className="h-full w-full bg-[repeating-linear-gradient(90deg,rgba(148,163,184,0.25)_0_8px,transparent_8px_16px)]" />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
