"use client";

import { Network, FileSearch, CheckCircle2, Ban } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { normalizeWorkflows, isActiveWorkflow, isAwaitingReview, isComplete, isBlocked } from "@/lib/api/workflow-normalizers";
import type { WorkflowsData } from "@/lib/hooks/useWorkflows";

export function WorkflowsKpis({ data }: { data: WorkflowsData }) {
  const { workflows } = data;
  const list = workflows.isSuccess ? normalizeWorkflows(workflows.data) : null;
  const loading = workflows.isLoading;

  const anyStatus = list ? list.some((w) => w.status) : false;
  const anyCompleted = list ? list.some((w) => w.status || w.completedAt) : false;
  const anyBlockSignal = list ? list.some((w) => w.status || w.blocked != null) : false;

  const active = list && anyStatus ? list.filter((w) => w.status && isActiveWorkflow(w)).length : null;
  const awaiting = list && anyStatus ? list.filter(isAwaitingReview).length : null;
  const completed = list && anyCompleted ? list.filter(isComplete).length : null;
  const blocked = list && anyBlockSignal ? list.filter(isBlocked).length : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi label="Active Workflows" icon={Network} accent="blue" value={active} caption={active != null ? "in flight" : undefined} loading={loading} unavailableHint="Workflows unavailable" />
      <RegistryKpi label="Awaiting Review" icon={FileSearch} accent="amber" value={awaiting} caption={awaiting != null ? "need attention" : undefined} loading={loading} unavailableHint="No status field" />
      <RegistryKpi label="Completed" icon={CheckCircle2} accent="green" value={completed} caption={completed != null ? "closed out" : undefined} loading={loading} unavailableHint="No status field" />
      <RegistryKpi label="Blocked" icon={Ban} accent="red" value={blocked} caption={blocked != null ? "stuck / failed" : undefined} loading={loading} unavailableHint="No status field" />
    </div>
  );
}
