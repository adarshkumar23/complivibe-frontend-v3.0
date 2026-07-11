"use client";

import { History, PlayCircle } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { formatRelativeTime } from "@/lib/utils/format";
import type { AutomationData } from "@/lib/hooks/useAutomation";

/** Recent executions from GET /api/v1/automation/executions. */
export function AutomationRunHistory({ data }: { data: AutomationData }) {
  const { executions } = data;
  const list = (executions.data ?? []).slice(0, 8);

  return (
    <SectionCard title="Run History" subtitle="Latest rule executions" icon={History} accent="purple">
      {executions.isLoading ? (
        <SkeletonRows rows={4} />
      ) : executions.isError ? (
        <ErrorState compact title="Unable to load run history" onRetry={() => executions.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          compact
          icon={PlayCircle}
          title="No executions yet"
          description="Rule runs and their outcomes will stream here."
        />
      ) : (
        <ul className="space-y-2.5">
          {list.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">Execution {e.id.slice(0, 8)}</p>
                <p className="text-[11px] text-cv-slate">{e.started_at ? formatRelativeTime(e.started_at) : "—"}</p>
              </div>
              {e.status ? (
                <StatusBadge
                  label={String(e.status)}
                  tone={e.status === "success" || e.status === "completed" ? "good" : e.status === "failed" ? "bad" : "info"}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
