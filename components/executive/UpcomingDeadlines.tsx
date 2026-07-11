"use client";

import { CalendarClock, CalendarOff } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { formatDate } from "@/lib/utils/format";
import type { ExecutiveData } from "@/lib/hooks/useExecutiveSummary";

export function UpcomingDeadlines({ data }: { data: ExecutiveData }) {
  const { deadlines } = data;
  const items = (deadlines.data ?? [])
    .filter((d) => d.status === "upcoming" || d.status === "overdue")
    .sort((a, b) => (a.days_until_due ?? Infinity) - (b.days_until_due ?? Infinity))
    .slice(0, 5);

  return (
    <SectionCard title="Upcoming Deadlines" subtitle="Filings and reviews on the horizon" icon={CalendarClock} accent="amber" className="h-full">
      {deadlines.isLoading ? (
        <SkeletonRows rows={4} />
      ) : deadlines.isError ? (
        <ErrorState compact title="Unable to load deadlines" onRetry={() => deadlines.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState compact icon={CalendarOff} title="No open deadlines" description="Tracked deadlines will appear here." />
      ) : (
        <ul className="space-y-2.5">
          {items.map((d) => {
            const days = d.days_until_due;
            const overdue = days != null && days < 0;
            return (
              <li key={d.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-cv-ink">{d.title}</p>
                  <p className="text-[11px] text-cv-slate">{formatDate(d.due_date) ?? d.due_date}</p>
                </div>
                {days != null ? (
                  <StatusBadge label={overdue ? `${Math.abs(days)}d late` : `${days}d`} tone={overdue ? "bad" : days <= 14 ? "warn" : "good"} />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
