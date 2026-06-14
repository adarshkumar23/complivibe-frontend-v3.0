"use client";

import { Layers, ListChecks, CalendarClock, Flame } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { normalizeFrameworks, normalizeObligations } from "@/lib/api/compliance-normalizers";
import { normalizeRegulatoryDeadlines, isHighPriority } from "@/lib/api/regulatory-normalizers";
import type { RegulatoryData } from "@/lib/hooks/useRegulatory";

export function RegulatoryKpis({ data }: { data: RegulatoryData }) {
  const { frameworks, obligations, deadlines } = data;

  const frameworkCount = frameworks.isSuccess ? normalizeFrameworks(frameworks.data).length : null;

  const obligationList = obligations.isSuccess ? normalizeObligations(obligations.data) : null;
  const openObligations = obligationList
    ? obligationList.filter((o) => !o.status || !/(closed|complete|completed|met|satisfied|done|resolved)/i.test(o.status)).length
    : null;

  const deadlineList = deadlines.isSuccess ? normalizeRegulatoryDeadlines(deadlines.data) : null;
  const upcoming = deadlineList ? deadlineList.filter((d) => d.daysRemaining != null && d.daysRemaining >= 0).length : null;
  // High priority counts only items the backend explicitly marks high/critical.
  const highPriority = deadlineList ? deadlineList.filter((d) => isHighPriority(d.priority)).length : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi label="Active Frameworks" icon={Layers} accent="blue" value={frameworkCount} caption={frameworkCount != null ? "tracked" : undefined} loading={frameworks.isLoading} unavailableHint="Frameworks unavailable" />
      <RegistryKpi label="Open Obligations" icon={ListChecks} accent="purple" value={openObligations} caption={openObligations != null ? "needing action" : undefined} loading={obligations.isLoading} unavailableHint="Obligations unavailable" />
      <RegistryKpi label="Upcoming Deadlines" icon={CalendarClock} accent="teal" value={upcoming} caption={upcoming != null ? "on the horizon" : undefined} loading={deadlines.isLoading} unavailableHint="Deadlines unavailable" />
      <RegistryKpi label="High-Priority Items" icon={Flame} accent="red" value={highPriority} caption={highPriority != null ? "flagged by backend" : undefined} loading={deadlines.isLoading} unavailableHint="Deadlines unavailable" />
    </div>
  );
}
