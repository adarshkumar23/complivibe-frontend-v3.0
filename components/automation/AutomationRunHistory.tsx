"use client";

import { History } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeAutomationRuns, resultTone, statusTone, runDuration } from "@/lib/api/automation-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { AutomationData } from "@/lib/hooks/useAutomation";

export function AutomationRunHistory({ data }: { data: AutomationData }) {
  const { runs } = data;
  const list = normalizeAutomationRuns(runs.data);

  return (
    <SectionCard title="Run History" subtitle="Recent automation executions" icon={History} accent="cyan" className="h-full">
      {runs.isLoading ? (
        <SkeletonRows rows={5} />
      ) : runs.isError ? (
        <EmptyState icon={History} title="Automation run history unavailable from backend." description="Execution runs, results, and durations will appear here once the backend records them." />
      ) : list.length === 0 ? (
        <EmptyState icon={History} title="No runs returned" description="Automation executions will appear here once they run." />
      ) : (
        <ul className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
          {list.slice(0, 14).map((r) => {
            const dur = runDuration(r);
            return (
              <li key={r.id} className="rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 truncate text-[13px] font-semibold text-cv-ink">{r.name || r.id}</p>
                  {r.result ? <StatusBadge label={r.result} tone={resultTone(r.result)} /> : r.status ? <StatusBadge label={r.status} tone={statusTone(r.status)} /> : null}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-cv-mist">
                  <span>{r.startedAt ? formatRelativeTime(r.startedAt) : "—"}</span>
                  {dur ? <span>{dur}</span> : null}
                  {r.error ? <span className="truncate text-rose-600">{r.error}</span> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
