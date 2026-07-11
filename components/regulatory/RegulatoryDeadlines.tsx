"use client";

import { CalendarClock, CalendarOff } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { formatDate } from "@/lib/utils/format";
import type { RegulatoryData } from "@/lib/hooks/useRegulatory";

/** Regulatory filings from GET /api/v1/compliance/deadlines?deadline_type=regulatory_filing. */
export function RegulatoryDeadlines({ data }: { data: RegulatoryData }) {
  const { deadlines } = data;
  const items = (deadlines.data ?? [])
    .filter((d) => d.status === "upcoming" || d.status === "overdue")
    .sort((a, b) => (a.days_until_due ?? Infinity) - (b.days_until_due ?? Infinity))
    .slice(0, 6);

  return (
    <SectionCard
      title="Regulatory Filings"
      subtitle="Statutory filings and reports on the clock"
      icon={CalendarClock}
      accent="amber"
      className="h-full"
    >
      {deadlines.isLoading ? (
        <SkeletonRows rows={5} />
      ) : deadlines.isError ? (
        <ErrorState compact title="Unable to load filings" onRetry={() => deadlines.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          compact
          icon={CalendarOff}
          title="No open filings"
          description="Regulatory filing deadlines will appear here once tracked."
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
                    {formatDate(d.due_date) ?? d.due_date} · {d.priority} priority
                  </p>
                </div>
                {days != null ? (
                  <StatusBadge
                    label={overdue ? `${Math.abs(days)}d overdue` : `${days}d left`}
                    tone={overdue ? "bad" : days <= 14 ? "warn" : "good"}
                  />
                ) : (
                  <StatusBadge label={d.status} tone="neutral" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
