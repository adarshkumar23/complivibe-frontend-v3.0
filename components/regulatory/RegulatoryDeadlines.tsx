"use client";

import { CalendarClock, CalendarOff, Link2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeRegulatoryDeadlines, priorityTone } from "@/lib/api/regulatory-normalizers";
import { deadlineTone, formatDate } from "@/lib/utils/format";
import type { RegulatoryData } from "@/lib/hooks/useRegulatory";

export function RegulatoryDeadlines({ data }: { data: RegulatoryData }) {
  const { deadlines } = data;
  const items = normalizeRegulatoryDeadlines(deadlines.data).sort(
    (a, b) => (a.daysRemaining ?? Infinity) - (b.daysRemaining ?? Infinity)
  );

  return (
    <SectionCard
      title="Regulatory Deadlines"
      subtitle="Time-sensitive obligations from the regulatory feed"
      icon={CalendarClock}
      accent="amber"
      className="h-full"
      action={deadlines.isSuccess && items.length > 0 ? <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">{items.length}</span> : null}
    >
      {deadlines.isLoading ? (
        <SkeletonRows rows={6} />
      ) : deadlines.isError ? (
        <ErrorState title="Regulatory deadlines unavailable" description="The deadlines endpoint did not respond. Other sections still work." onRetry={() => deadlines.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon={CalendarOff} title="No regulatory deadlines returned by backend." description="Upcoming regulatory obligations and their due dates will appear here once the backend reports them." />
      ) : (
        <ul className="max-h-[520px] space-y-2.5 overflow-y-auto pr-1">
          {items.map((d) => {
            const date = formatDate(d.dueDate);
            const tone = deadlineTone(d.daysRemaining);
            return (
              <li key={d.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold leading-snug text-cv-ink">{d.title}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-cv-slate">
                      {[d.framework, d.jurisdiction].filter(Boolean).join(" · ") || <span className="text-cv-mist">No framework / jurisdiction</span>}
                    </p>
                    {d.linkedObligation ? (
                      <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-cv-blue">
                        <Link2 size={12} /> {d.linkedObligation}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {d.daysRemaining != null ? (
                      <StatusBadge label={d.daysRemaining < 0 ? "Overdue" : `${d.daysRemaining}d`} tone={tone === "good" ? "good" : tone === "warn" ? "warn" : "bad"} />
                    ) : (
                      <StatusBadge label="No date" tone="neutral" />
                    )}
                    {d.priority ? <StatusBadge label={d.priority} tone={priorityTone(d.priority)} /> : null}
                  </div>
                </div>
                {date ? <p className="mt-1.5 text-[11px] font-medium text-cv-mist">Due {date}</p> : null}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
