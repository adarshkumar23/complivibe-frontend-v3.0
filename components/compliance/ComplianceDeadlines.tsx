"use client";

import { CalendarClock, CalendarOff } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { formatDate } from "@/lib/utils/format";
import type { Compliance } from "@/lib/hooks/useCompliance";

const ACTIVE = new Set(["upcoming", "overdue"]);

export function ComplianceDeadlines({ data }: { data: Compliance }) {
  const { deadlines, deadlineSummary } = data;
  const items = (deadlines.data ?? [])
    .filter((d) => ACTIVE.has(d.status))
    .sort((a, b) => (a.days_until_due ?? Infinity) - (b.days_until_due ?? Infinity))
    .slice(0, 5);
  const summary = deadlineSummary.data;

  return (
    <SectionCard
      title="Compliance Deadlines"
      subtitle="Filings, reviews, and audits on the clock"
      icon={CalendarClock}
      accent="amber"
      action={
        summary && summary.overdue_deadlines > 0 ? (
          <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold text-rose-600 ring-1 ring-rose-500/20">
            {summary.overdue_deadlines} overdue
          </span>
        ) : null
      }
    >
      {deadlines.isLoading ? (
        <SkeletonRows rows={4} />
      ) : deadlines.isError ? (
        <ErrorState compact title="Unable to load deadlines" onRetry={() => deadlines.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          compact
          icon={CalendarOff}
          title="No open deadlines"
          description="Regulatory filings, control reviews, and audit prep deadlines will appear here."
        />
      ) : (
        <ul className="space-y-2.5">
          {items.map((d) => {
            const days = d.days_until_due;
            const overdue = days != null && days < 0;
            return (
              <li key={d.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-cv-ink">{d.title}</p>
                  <p className="text-[11px] text-cv-slate">
                    {d.deadline_type.replaceAll("_", " ")} · {formatDate(d.due_date) ?? d.due_date}
                    {d.is_status_stale ? " · status needs update" : ""}
                  </p>
                </div>
                {days != null ? (
                  <StatusBadge
                    label={overdue ? `${Math.abs(days)}d overdue` : `${days}d`}
                    tone={overdue ? "bad" : days <= 14 ? "warn" : "good"}
                  />
                ) : (
                  <StatusBadge label={d.priority} tone="neutral" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
