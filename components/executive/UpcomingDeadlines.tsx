"use client";

import { useRouter } from "next/navigation";
import { CalendarClock, CalendarOff, ArrowUpRight } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { upcomingDeadlines } from "@/lib/api/executive-normalizers";
import { deadlineTone, formatDate } from "@/lib/utils/format";
import type { ExecutiveSummaryData } from "@/lib/hooks/useExecutiveSummary";

export function UpcomingDeadlines({ data }: { data: ExecutiveSummaryData }) {
  const { regulatory, questionnaires, approvals } = data;
  const router = useRouter();
  const items = upcomingDeadlines(regulatory.data, questionnaires.data, approvals.data).slice(0, 8);

  const loading = regulatory.isLoading && questionnaires.isLoading && approvals.isLoading;

  return (
    <SectionCard title="Upcoming Deadlines" subtitle="Regulatory, questionnaire & approval due dates" icon={CalendarClock} accent="amber" className="h-full">
      {loading ? (
        <SkeletonRows rows={5} />
      ) : items.length === 0 ? (
        <EmptyState icon={CalendarOff} title="No upcoming deadlines" description="Deadlines will appear here once the backend returns records with due dates." />
      ) : (
        <ul className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
          {items.map((d) => {
            const tone = deadlineTone(d.daysRemaining);
            return (
              <li key={d.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-cv-ink">{d.title}</p>
                  <p className="truncate text-[11px] text-cv-slate">{[d.source, d.date ? formatDate(d.date) : null].filter(Boolean).join(" · ")}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {d.daysRemaining != null ? (
                    <StatusBadge label={d.daysRemaining < 0 ? "Overdue" : `${d.daysRemaining}d`} tone={tone === "good" ? "good" : tone === "warn" ? "warn" : "bad"} />
                  ) : null}
                  <button type="button" onClick={() => router.push(d.route)} aria-label="Open" className="inline-flex h-7 w-7 items-center justify-center rounded-full text-cv-mist transition hover:bg-white/70 hover:text-cv-blue"><ArrowUpRight size={14} /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
