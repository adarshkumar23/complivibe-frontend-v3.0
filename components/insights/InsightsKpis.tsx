"use client";

import { Lightbulb, Flame, FileWarning, CalendarClock } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { isHighPriorityInsight } from "@/lib/api/insight-normalizers";
import type { ProactiveInsightsData } from "@/lib/hooks/useProactiveInsights";

export function InsightsKpis({ data }: { data: ProactiveInsightsData }) {
  const { insights, isLoading, allUnavailable } = data;

  const active = allUnavailable ? null : insights.length;
  const high = allUnavailable ? null : insights.filter(isHighPriorityInsight).length;
  const evidenceGaps = allUnavailable ? null : insights.filter((i) => i.recommendation === "Attach evidence").length;
  const deadlineRisks = allUnavailable ? null : insights.filter((i) => i.category === "deadlines").length;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi label="Active Insights" icon={Lightbulb} accent="blue" value={active} caption={active != null ? "signals detected" : undefined} loading={isLoading && insights.length === 0} unavailableHint="Insights unavailable" />
      <RegistryKpi label="High Priority" icon={Flame} accent="red" value={high} caption={high != null ? "need action" : undefined} loading={isLoading && insights.length === 0} unavailableHint="No priority data" />
      <RegistryKpi label="Evidence Gaps" icon={FileWarning} accent="amber" value={evidenceGaps} caption={evidenceGaps != null ? "risks lacking evidence" : undefined} loading={isLoading && insights.length === 0} unavailableHint="Unavailable" />
      <RegistryKpi label="Deadline Risks" icon={CalendarClock} accent="purple" value={deadlineRisks} caption={deadlineRisks != null ? "time-sensitive" : undefined} loading={isLoading && insights.length === 0} unavailableHint="Unavailable" />
    </div>
  );
}
