"use client";

import { useRouter } from "next/navigation";
import { CalendarClock, CalendarOff, ArrowUpRight } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeRegulatoryDeadlines, priorityTone } from "@/lib/api/regulatory-normalizers";
import { deadlineTone, formatDate } from "@/lib/utils/format";
import type { PrivacyData } from "@/lib/hooks/usePrivacy";

export function RegulatoryDeadlinePanel({ data }: { data: PrivacyData }) {
  const { regulatory } = data;
  const router = useRouter();
  const items = normalizeRegulatoryDeadlines(regulatory.data).sort((a, b) => (a.daysRemaining ?? Infinity) - (b.daysRemaining ?? Infinity));

  return (
    <SectionCard
      title="Regulatory Deadlines"
      subtitle="Privacy & data-protection obligations"
      icon={CalendarClock}
      accent="amber"
      action={<button type="button" onClick={() => router.push("/dashboard/regulatory")} className="cv-ring-focus inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1.5 text-[11px] font-bold text-cv-ink ring-1 ring-white/70 transition hover:bg-white">All <ArrowUpRight size={12} /></button>}
    >
      {regulatory.isLoading ? (
        <SkeletonRows rows={4} />
      ) : regulatory.isError ? (
        <ErrorState compact title="Deadlines unavailable" onRetry={() => regulatory.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon={CalendarOff} title="No regulatory deadlines" description="Privacy-related deadlines will appear here once the backend returns them." />
      ) : (
        <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {items.slice(0, 8).map((d) => {
            const tone = deadlineTone(d.daysRemaining);
            return (
              <li key={d.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-cv-ink">{d.title}</p>
                  <p className="truncate text-[11px] text-cv-slate">{[d.framework, d.jurisdiction, d.dueDate ? formatDate(d.dueDate) : null].filter(Boolean).join(" · ") || "—"}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {d.daysRemaining != null ? <StatusBadge label={d.daysRemaining < 0 ? "Overdue" : `${d.daysRemaining}d`} tone={tone === "good" ? "good" : tone === "warn" ? "warn" : "bad"} /> : null}
                  {d.priority ? <StatusBadge label={d.priority} tone={priorityTone(d.priority)} /> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
