"use client";

import { Clock, AlarmClock, RefreshCw, CheckCircle2 } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { normalizeApprovals, isPending, isOverdue, isChangesRequested, isApproved } from "@/lib/api/approval-normalizers";
import type { ApprovalsData } from "@/lib/hooks/useApprovals";

export function ApprovalsKpis({ data }: { data: ApprovalsData }) {
  const { approvals } = data;
  const list = approvals.isSuccess ? normalizeApprovals(approvals.data) : null;
  const loading = approvals.isLoading;

  // Counts derive only from real backend status/decision fields.
  const anyStatus = list ? list.some((a) => a.status || a.decision) : false;
  const pending = list && anyStatus ? list.filter(isPending).length : null;
  const anyDue = list ? list.some((a) => a.dueDate) : false;
  const overdue = list && anyDue ? list.filter(isOverdue).length : null;
  const changes = list && anyStatus ? list.filter(isChangesRequested).length : null;
  const approved = list && anyStatus ? list.filter(isApproved).length : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi label="Pending Approvals" icon={Clock} accent="amber" value={pending} caption={pending != null ? "awaiting review" : undefined} loading={loading} unavailableHint="Queue unavailable" />
      <RegistryKpi label="Overdue Reviews" icon={AlarmClock} accent="red" value={overdue} caption={overdue != null ? "past due date" : undefined} loading={loading} unavailableHint="No due dates" />
      <RegistryKpi label="Changes Requested" icon={RefreshCw} accent="purple" value={changes} caption={changes != null ? "returned to owner" : undefined} loading={loading} unavailableHint="No status field" />
      <RegistryKpi label="Approved" icon={CheckCircle2} accent="green" value={approved} caption={approved != null ? "signed off" : undefined} loading={loading} unavailableHint="No status field" />
    </div>
  );
}
