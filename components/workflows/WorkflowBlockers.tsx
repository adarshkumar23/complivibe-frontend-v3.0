"use client";

import { Ban, ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeWorkflows, isBlocked, isOverdue, statusTone } from "@/lib/api/workflow-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { WorkflowsData } from "@/lib/hooks/useWorkflows";

export function WorkflowBlockers({ data }: { data: WorkflowsData }) {
  const { workflows } = data;
  const list = normalizeWorkflows(workflows.data);

  // Only real, explicit blocked/overdue signals — never inferred from missing data.
  const hasBlockSignal = list.some((w) => w.status || w.blocked != null || w.dueDate);
  const blockers = list.filter((w) => isBlocked(w) || isOverdue(w));

  return (
    <SectionCard title="Workflow Blockers" subtitle="Blocked, failed & overdue workflows" icon={Ban} accent="red" className="h-full">
      {workflows.isLoading ? (
        <SkeletonRows rows={4} />
      ) : workflows.isError || !hasBlockSignal ? (
        <EmptyState icon={Ban} title="Workflow blocker data unavailable from backend." description="Blocked, failed, and overdue workflows will appear here once the backend reports those states." />
      ) : blockers.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No blockers" description="No workflows are reported as blocked, failed, or overdue." />
      ) : (
        <ul className="max-h-[360px] space-y-2.5 overflow-y-auto pr-1">
          {blockers.slice(0, 10).map((w) => (
            <li key={w.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{w.name}</p>
                <p className="truncate text-[11px] text-cv-mist">
                  {[w.currentStage, w.dueDate ? `Due ${formatDate(w.dueDate)}` : null, w.linkedResource].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
              <StatusBadge label={isBlocked(w) ? (w.status || "Blocked") : "Overdue"} tone={isBlocked(w) ? statusTone(w.status) : "bad"} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
