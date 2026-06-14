"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, ArrowUpRight, Check, CheckCheck, Clock } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { severityTone, isOverdue, type SignalCategoryKey } from "@/lib/api/notification-normalizers";
import { formatRelativeTime, formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { NotificationsData } from "@/lib/hooks/useNotifications";

/** No backend action endpoint exists — disabled, never fakes a result. */
function DisabledAction({ icon: Icon, label }: { icon: typeof Check; label: string }) {
  return (
    <button type="button" disabled title="Action endpoint unavailable" className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full bg-white/55 px-2.5 py-1.5 text-[11px] font-semibold text-cv-mist ring-1 ring-white/60">
      <Icon size={12} /> {label}
    </button>
  );
}

export function NotificationFeed({ data }: { data: NotificationsData }) {
  const { signals, isLoading, allUnavailable, usingDedicatedFeed } = data;
  const router = useRouter();
  const [filter, setFilter] = useState<SignalCategoryKey | "all">("all");

  const counts = useMemo(() => {
    const m = new Map<SignalCategoryKey, number>();
    for (const s of signals) m.set(s.categoryKey, (m.get(s.categoryKey) ?? 0) + 1);
    return m;
  }, [signals]);

  const filtered = useMemo(() => {
    const list = filter === "all" ? signals : signals.filter((s) => s.categoryKey === filter);
    return [...list].sort((a, b) => {
      const ta = a.date ? new Date(a.date).getTime() : 0;
      const tb = b.date ? new Date(b.date).getTime() : 0;
      return tb - ta;
    });
  }, [signals, filter]);

  const chips = useMemo(() => [...counts.entries()].sort((a, b) => b[1] - a[1]), [counts]);

  return (
    <SectionCard
      title={usingDedicatedFeed ? "Notifications" : "Governance Signals"}
      subtitle={usingDedicatedFeed ? "From the notifications service" : "Attention items aggregated from connected modules"}
      icon={Bell}
      accent="blue"
      action={<DisabledAction icon={CheckCheck} label="Mark all as read" />}
    >
      {isLoading && signals.length === 0 ? (
        <SkeletonRows rows={6} />
      ) : allUnavailable ? (
        <EmptyState icon={BellOff} title="Notification sources unavailable from backend." description="Alerts, incidents, risks, deadlines, approvals, and other governance signals will appear here once their sources return data." />
      ) : signals.length === 0 ? (
        <EmptyState icon={BellOff} title="No governance signals" description="You're all clear — no attention items reported across connected modules." />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" onClick={() => setFilter("all")} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition", filter === "all" ? "bg-cv-brand text-white shadow-button" : "bg-white/55 text-cv-slate ring-1 ring-white/70 hover:text-cv-ink")}>
              All <span className="opacity-70">{signals.length}</span>
            </button>
            {chips.map(([key, count]) => (
              <button key={key} type="button" onClick={() => setFilter(key)} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition", filter === key ? "bg-cv-brand text-white shadow-button" : "bg-white/55 text-cv-slate ring-1 ring-white/70 hover:text-cv-ink")}>
                {signals.find((s) => s.categoryKey === key)?.category} <span className="opacity-70">{count}</span>
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState compact icon={BellOff} title="No signals in this category" description="Try another filter." />
          ) : (
            <ul className="max-h-[620px] space-y-2.5 overflow-y-auto pr-1">
              {filtered.slice(0, 100).map((s) => {
                const overdue = isOverdue(s);
                return (
                  <li key={`${s.categoryKey}-${s.id}`} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-cv-brand-soft px-2 py-0.5 text-[10px] font-semibold text-cv-blue ring-1 ring-white/60">{s.category}</span>
                          {s.severity ? <StatusBadge label={s.severity} tone={severityTone(s.severity)} /> : null}
                          {s.status ? <StatusBadge label={s.status} tone="neutral" /> : null}
                          {overdue ? <StatusBadge label="Overdue" tone="bad" /> : null}
                        </div>
                        <p className="mt-1 truncate text-[14px] font-semibold text-cv-ink">{s.title}</p>
                        <p className="truncate text-[11px] text-cv-slate">
                          {[s.linkedResource, s.dueDate ? `Due ${formatDate(s.dueDate)}` : null, s.date ? formatRelativeTime(s.date) : null].filter(Boolean).join(" · ") || s.source}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        {s.route ? (
                          <button type="button" onClick={() => router.push(s.route!)} className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-bold text-cv-ink ring-1 ring-white/70 transition hover:bg-white">
                            Open <ArrowUpRight size={13} />
                          </button>
                        ) : null}
                        <div className="flex gap-1.5">
                          <DisabledAction icon={Check} label="Resolve" />
                          <DisabledAction icon={Clock} label="Snooze" />
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </SectionCard>
  );
}
