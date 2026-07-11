"use client";

import { Waves, PlugZap } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import type { DriftData } from "@/lib/hooks/useDrift";

/** Statistical drift results from GET /api/v1/ai-governance/mlflow/drift. */
export function DriftOverviewTable({ data }: { data: DriftData }) {
  const { drift, connection } = data;
  const list = drift.data ?? [];
  const connected = connection.isSuccess ? connection.data != null : null;

  return (
    <SectionCard
      title="Model Drift"
      subtitle="Statistical drift tests against MLflow-tracked models"
      icon={Waves}
      accent="blue"
      className="h-full"
    >
      {drift.isLoading || connection.isLoading ? (
        <SkeletonRows rows={5} />
      ) : drift.isError ? (
        <ErrorState title="Unable to load drift results" onRetry={() => drift.refetch()} />
      ) : connected === false ? (
        <EmptyState
          icon={PlugZap}
          title="MLflow not connected"
          description="Connect your MLflow tracking server in Settings to enable real statistical drift detection."
        />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Waves}
          title="No drift checks recorded"
          description="Drift results appear here after the first monitoring run against tracked models."
        />
      ) : (
        <ul className="space-y-2.5">
          {list.map((d, i) => (
            <li key={i} className="flex items-center justify-between gap-3 rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{d.model_name ?? "Unknown model"}</p>
                <p className="text-[11px] text-cv-slate">
                  {[d.metric, d.p_value != null ? `p=${d.p_value}` : null].filter(Boolean).join(" · ")}
                </p>
              </div>
              <StatusBadge
                label={d.drift_detected ? "Drift detected" : "Stable"}
                tone={d.drift_detected ? "bad" : "good"}
              />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
