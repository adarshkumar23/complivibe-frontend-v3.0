"use client";

import { Bell, Flame, Brain, Lightbulb, TriangleAlert, CalendarClock } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { buildAlertFeed } from "@/lib/api/alert-normalizers";
import { normalizeAlerts, normalizeDeadlines } from "@/lib/api/normalizers";
import { normalizeRisks, isMitigated } from "@/lib/api/risk-normalizers";
import type { AlertsData } from "@/lib/hooks/useAlerts";

export function AlertKpis({ data }: { data: AlertsData }) {
  const { insights, predictive, risks, deadlines } = data;
  const feed = buildAlertFeed(insights.data, predictive.data);

  const loaded = insights.isSuccess || predictive.isSuccess;
  const total = loaded ? feed.length : null;
  const critical = loaded ? feed.filter((a) => a.severity === "critical" || a.severity === "high").length : null;
  const predictiveCount = predictive.isSuccess ? normalizeAlerts(undefined, predictive.data).length : null;
  const proactiveCount = insights.isSuccess ? normalizeAlerts(insights.data, undefined).length : null;

  const openRisks = risks.isSuccess ? normalizeRisks(risks.data).filter((r) => !isMitigated(r.status)).length : null;
  const upcomingDeadlines = deadlines.isSuccess
    ? normalizeDeadlines(deadlines.data).filter((d) => d.daysRemaining != null && d.daysRemaining >= 0).length
    : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      <RegistryKpi label="Total Alerts" icon={Bell} accent="blue" value={total} caption={total != null ? "active signals" : undefined} loading={insights.isLoading && predictive.isLoading} unavailableHint="Feed unavailable" />
      <RegistryKpi label="Critical / High" icon={Flame} accent="red" value={critical} caption={critical != null ? "elevated severity" : undefined} loading={insights.isLoading && predictive.isLoading} unavailableHint="Feed unavailable" />
      <RegistryKpi label="Predictive Signals" icon={Brain} accent="purple" value={predictiveCount} caption={predictiveCount != null ? "forecasted" : undefined} loading={predictive.isLoading} unavailableHint="Unavailable" />
      <RegistryKpi label="Proactive Insights" icon={Lightbulb} accent="amber" value={proactiveCount} caption={proactiveCount != null ? "detected" : undefined} loading={insights.isLoading} unavailableHint="Unavailable" />
      <RegistryKpi label="Open Risks" icon={TriangleAlert} accent="red" value={openRisks} caption={openRisks != null ? "needing action" : undefined} loading={risks.isLoading} unavailableHint="No risk data" />
      <RegistryKpi label="Upcoming Deadlines" icon={CalendarClock} accent="teal" value={upcomingDeadlines} caption={upcomingDeadlines != null ? "on the horizon" : undefined} loading={deadlines.isLoading} unavailableHint="No deadlines" />
    </div>
  );
}
