"use client";

import { GitBranch } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { normalizeAiSystems, lifecycleDistribution } from "@/lib/api/ai-system-normalizers";
import type { AiSystemsData } from "@/lib/hooks/useAiSystems";

export function LifecycleStages({ data }: { data: AiSystemsData }) {
  const { systems } = data;
  const list = normalizeAiSystems(systems.data);
  const buckets = lifecycleDistribution(list);
  const max = buckets.reduce((m, b) => Math.max(m, b.value), 0) || 1;

  return (
    <SectionCard title="Lifecycle Stages" subtitle="Systems by lifecycle / status" icon={GitBranch} accent="cyan">
      {systems.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : systems.isError ? (
        <ErrorState compact title="Unable to load systems" onRetry={() => systems.refetch()} />
      ) : buckets.length === 0 ? (
        <EmptyState
          compact
          icon={GitBranch}
          title="No lifecycle data"
          description="Lifecycle stages will appear here once systems report a stage or status."
        />
      ) : (
        <ul className="space-y-3.5">
          {buckets.map((b) => (
            <li key={b.label}>
              <div className="mb-1.5 flex items-center justify-between text-[13px]">
                <span className="truncate font-semibold capitalize text-cv-ink">{b.label}</span>
                <span className="font-bold text-cv-ink">{b.value}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-400/12">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(6, (b.value / max) * 100)}%`, background: b.color }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
