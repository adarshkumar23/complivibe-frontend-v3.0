"use client";

import { Inbox, Flame, AlarmClock, CheckCircle2 } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { isOpen, isHighPriority, isOverdue, isResolved } from "@/lib/api/notification-normalizers";
import type { NotificationsData } from "@/lib/hooks/useNotifications";

export function NotificationsKpis({ data }: { data: NotificationsData }) {
  const { signals, isLoading, allUnavailable } = data;

  const open = allUnavailable ? null : signals.filter(isOpen).length;
  const high = allUnavailable ? null : signals.filter(isHighPriority).length;
  const overdue = allUnavailable ? null : signals.filter(isOverdue).length;
  const resolved = allUnavailable ? null : signals.filter(isResolved).length;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi label="Open Signals" icon={Inbox} accent="blue" value={open} caption={open != null ? "need attention" : undefined} loading={isLoading && signals.length === 0} unavailableHint="Signals unavailable" />
      <RegistryKpi label="High Priority" icon={Flame} accent="red" value={high} caption={high != null ? "backend-flagged" : undefined} loading={isLoading && signals.length === 0} unavailableHint="No priority data" />
      <RegistryKpi label="Overdue" icon={AlarmClock} accent="amber" value={overdue} caption={overdue != null ? "past due date" : undefined} loading={isLoading && signals.length === 0} unavailableHint="No due dates" />
      <RegistryKpi label="Recently Resolved" icon={CheckCircle2} accent="green" value={resolved} caption={resolved != null ? "closed out" : undefined} loading={isLoading && signals.length === 0} unavailableHint="No resolved data" />
    </div>
  );
}
