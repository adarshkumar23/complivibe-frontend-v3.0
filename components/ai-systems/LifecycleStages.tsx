"use client";

import { GitBranch } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import type { AiSystemsData } from "@/lib/hooks/useAiSystems";

const STAGE_ORDER = ["proposed", "in_development", "testing", "production", "retired", "archived"];
const barColors = ["#94A3B8", "#F59E0B", "#3B82F6", "#10B981", "#64748B", "#CBD5E1"];

/** Lifecycle distribution from GET /api/v1/ai-systems/summary. */
export function LifecycleStages({ data }: { data: AiSystemsData }) {
  const { summary } = data;
  const byStage = summary.data?.by_lifecycle_status ?? {};
  const entries = STAGE_ORDER.filter((s) => byStage[s] != null).map((s) => [s, byStage[s]] as const);
  const total = entries.reduce((acc, [, n]) => acc + n, 0);

  return (
    <SectionCard title="Lifecycle Stages" subtitle="Where systems sit in the pipeline" icon={GitBranch} accent="blue">
      {summary.isLoading ? (
        <SkeletonRows rows={4} />
      ) : summary.isError ? (
        <ErrorState compact title="Unable to load lifecycle data" onRetry={() => summary.refetch()} />
      ) : entries.length === 0 ? (
        <EmptyState compact icon={GitBranch} title="No systems yet" description="Lifecycle distribution will appear here." />
      ) : (
        <ul className="space-y-3">
          {entries.map(([stage, count], i) => (
            <li key={stage}>
              <div className="mb-1 flex items-center justify-between text-[12px]">
                <span className="font-semibold text-cv-ink">{stage.replaceAll("_", " ")}</span>
                <span className="font-medium text-cv-slate">{count}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-400/12">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(6, (count / total) * 100)}%`, background: barColors[STAGE_ORDER.indexOf(stage)] ?? barColors[i] }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
