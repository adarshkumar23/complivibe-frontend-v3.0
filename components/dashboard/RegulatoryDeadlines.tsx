"use client";

import { CalendarClock, CalendarOff } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import type { CommandCenterData } from "@/lib/hooks/useCommandCenter";

/** Nearest deadlines from GET /api/v1/compliance/deadlines. */
export function RegulatoryDeadlines({ data }: { data: CommandCenterData }) {
  const { deadlines } = data;
  const items = (deadlines.data ?? [])
    .filter((d) => d.status === "upcoming" || d.status === "overdue")
    .sort((a, b) => (a.days_until_due ?? Infinity) - (b.days_until_due ?? Infinity))
    .slice(0, 4);

  return (
    <SectionCard title="Deadlines" subtitle="Nearest compliance dates" icon={CalendarClock} accent="amber">
      {deadlines.isLoading ? (
        <SkeletonRows rows={3} />
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
                <p className="truncate text-[13px] font-semibold text-cv-ink">{d.title}</p>
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
