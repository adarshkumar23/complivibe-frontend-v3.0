"use client";

import { Radio, CheckCircle2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { formatRelativeTime } from "@/lib/utils/format";
import type { Severity } from "@/lib/api/types";
import type { AiMonitoringData } from "@/lib/hooks/useAiMonitoring";

/** Governance signals from GET /api/v1/ai-governance/signals. */
export function MonitoringOverviewTable({ data }: { data: AiMonitoringData }) {
  const { signals } = data;
  const list = (signals.data ?? []).slice(0, 12);

  return (
    <SectionCard
      title="Governance Signals"
      subtitle="Model, data, and policy signals raised by the platform"
      icon={Radio}
      accent="blue"
      className="h-full"
      action={
        signals.isSuccess ? (
          <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
            {(signals.data ?? []).length} signals
          </span>
        ) : null
      }
    >
      {signals.isLoading ? (
        <SkeletonRows rows={6} />
      ) : signals.isError ? (
        <ErrorState title="Unable to load signals" onRetry={() => signals.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No governance signals"
          description="Signals appear here when monitoring detects drift, policy gaps, or stale assessments."
        />
      ) : (
        <ul className="space-y-2.5">
          {list.map((s) => (
            <li key={s.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold leading-snug text-cv-ink">
                    {(s.title as string) || (s.summary as string) || (s.signal_type ?? "signal").replaceAll("_", " ")}
                  </p>
                  <p className="mt-0.5 text-[11px] text-cv-slate">
                    {[s.signal_type?.replaceAll("_", " "), s.entity_type, s.created_at ? formatRelativeTime(s.created_at) : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {s.severity ? <SeverityBadge severity={s.severity as Severity} /> : null}
                  {s.status ? <StatusBadge label={s.status} tone={s.status === "open" ? "warn" : "neutral"} /> : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
