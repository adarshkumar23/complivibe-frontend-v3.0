"use client";

import { Bell, BellOff } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeAlerts } from "@/lib/api/normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { CommandCenter } from "@/lib/hooks/useCommandCenter";

export function OpenAlerts({ data }: { data: CommandCenter }) {
  const { insights, predictive } = data;
  const loading = insights.isLoading || predictive.isLoading;
  const errored = insights.isError && predictive.isError;
  const alerts = normalizeAlerts(insights.data, predictive.data).slice(0, 4);

  return (
    <SectionCard
      title="Open Alerts"
      subtitle="Proactive & predictive signals"
      icon={Bell}
      accent="amber"
      className="h-full"
      action={
        alerts.length > 0 ? (
          <span className="inline-flex items-center justify-center rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-600 ring-1 ring-rose-500/20">
            {alerts.length}
          </span>
        ) : null
      }
    >
      {loading ? (
        <SkeletonRows rows={4} />
      ) : errored ? (
        <ErrorState
          title="Unable to load alerts"
          onRetry={() => {
            insights.refetch();
            predictive.refetch();
          }}
        />
      ) : alerts.length === 0 ? (
        <EmptyState icon={BellOff} title="No open alerts" description="You're all clear — no proactive or predictive alerts right now." />
      ) : (
        <ul className="space-y-2.5">
          {alerts.map((alert) => {
            const time = formatRelativeTime(alert.timestamp);
            return (
              <li
                key={alert.id}
                className="rounded-2xl bg-white/55 p-3.5 ring-1 ring-white/70 transition hover:bg-white/80"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] font-semibold leading-snug text-cv-ink">{alert.title}</p>
                  <SeverityBadge severity={alert.severity} />
                </div>
                {alert.description ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-cv-slate">{alert.description}</p>
                ) : null}
                {time ? <p className="mt-1.5 text-[11px] font-medium text-cv-mist">{time}</p> : null}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
