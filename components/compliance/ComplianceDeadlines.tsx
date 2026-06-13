"use client";

import { CalendarClock, CalendarOff } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeDeadlines } from "@/lib/api/normalizers";
import { deadlineTone, formatDate } from "@/lib/utils/format";
import type { Compliance } from "@/lib/hooks/useCompliance";

export function ComplianceDeadlines({ data }: { data: Compliance }) {
  const { deadlines } = data;
  const items = normalizeDeadlines(deadlines.data)
    .sort((a, b) => (a.daysRemaining ?? Infinity) - (b.daysRemaining ?? Infinity))
    .slice(0, 5);

  return (
    <SectionCard title="Upcoming Regulatory Deadlines" subtitle="Obligations on the horizon" icon={CalendarClock} accent="amber">
      {deadlines.isLoading ? (
        <SkeletonRows rows={4} />
      ) : deadlines.isError ? (
        <ErrorState compact title="Unable to load deadlines" onRetry={() => deadlines.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          compact
          icon={CalendarOff}
          title="No deadlines tracked"
          description="Upcoming regulatory deadlines will appear here as they are detected."
        />
      ) : (
        <ul className="space-y-2.5">
          {items.map((d) => {
            const tone = deadlineTone(d.daysRemaining);
            const date = formatDate(d.dueDate);
            return (
              <li key={d.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-cv-ink">{d.title}</p>
                  {date ? <p className="text-[11px] text-cv-slate">{date}</p> : null}
                </div>
                {d.daysRemaining != null ? (
                  <StatusBadge
                    label={d.daysRemaining < 0 ? "Overdue" : `${d.daysRemaining}d`}
                    tone={tone === "good" ? "good" : tone === "warn" ? "warn" : "bad"}
                  />
                ) : (
                  <StatusBadge label="No date" tone="neutral" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
