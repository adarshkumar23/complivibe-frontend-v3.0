"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, ArrowUpRight, UserPlus, Check, Info } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { insightSeverityTone, insightSourceMap, type InsightCategoryKey } from "@/lib/api/insight-normalizers";
import { cn } from "@/lib/utils/cn";
import type { ProactiveInsightsData } from "@/lib/hooks/useProactiveInsights";

function DisabledAction({ icon: Icon, label }: { icon: typeof Check; label: string }) {
  return (
    <button type="button" disabled title="Action endpoint unavailable" className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full bg-white/55 px-2.5 py-1.5 text-[11px] font-semibold text-cv-mist ring-1 ring-white/60">
      <Icon size={12} /> {label}
    </button>
  );
}

export function InsightFeed({ data }: { data: ProactiveInsightsData }) {
  const { insights, isLoading, allUnavailable, usingBackend } = data;
  const router = useRouter();
  const [filter, setFilter] = useState<InsightCategoryKey | "all">("all");

  const chips = useMemo(() => insightSourceMap(insights), [insights]);
  const filtered = filter === "all" ? insights : insights.filter((i) => i.category === filter);

  return (
    <SectionCard
      title={usingBackend ? "Insights" : "Insights (derived)"}
      subtitle={usingBackend ? "From the proactive intelligence service" : "Derived from available records"}
      icon={Lightbulb}
      accent="blue"
      action={insights.length > 0 ? <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">{insights.length}</span> : null}
    >
      {isLoading && insights.length === 0 ? (
        <SkeletonRows rows={6} />
      ) : allUnavailable ? (
        <EmptyState icon={Lightbulb} title="Insights unavailable from backend." description="Proactive insights will appear here once the intelligence service or its source records return data." />
      ) : insights.length === 0 ? (
        <EmptyState icon={Lightbulb} title="No insights right now" description="No governance gaps or attention items were detected across available records." />
      ) : (
        <div className="flex flex-col gap-4">
          {!usingBackend ? (
            <p className="flex items-center gap-1.5 rounded-xl bg-blue-500/8 px-3 py-2 text-[11px] font-medium text-cv-blue ring-1 ring-blue-500/15">
              <Info size={13} /> Derived from available records — factual signals only.
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" onClick={() => setFilter("all")} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition", filter === "all" ? "bg-cv-brand text-white shadow-button" : "bg-white/55 text-cv-slate ring-1 ring-white/70 hover:text-cv-ink")}>
              All <span className="opacity-70">{insights.length}</span>
            </button>
            {chips.map((c) => (
              <button key={c.key} type="button" onClick={() => setFilter(c.key)} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition", filter === c.key ? "bg-cv-brand text-white shadow-button" : "bg-white/55 text-cv-slate ring-1 ring-white/70 hover:text-cv-ink")}>
                {c.label} <span className="opacity-70">{c.count}</span>
              </button>
            ))}
          </div>

          <ul className="max-h-[620px] space-y-2.5 overflow-y-auto pr-1">
            {filtered.slice(0, 100).map((i) => (
              <li key={i.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-cv-brand-soft px-2 py-0.5 text-[10px] font-semibold text-cv-blue ring-1 ring-white/60">{i.categoryLabel}</span>
                      {i.severity ? <StatusBadge label={i.severity} tone={insightSeverityTone(i.severity)} /> : null}
                    </div>
                    <p className="mt-1 truncate text-[14px] font-semibold text-cv-ink">{i.title}</p>
                    {i.description ? <p className="line-clamp-2 text-[11px] text-cv-slate">{i.description}</p> : null}
                  </div>
                  {i.route ? (
                    <button type="button" onClick={() => router.push(i.route!)} className="cv-ring-focus inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-bold text-cv-ink ring-1 ring-white/70 transition hover:bg-white">
                      Open <ArrowUpRight size={13} />
                    </button>
                  ) : null}
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-white/50 pt-2.5">
                  {i.recommendation ? <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-cv-slate ring-1 ring-slate-200/70">Next: {i.recommendation}</span> : null}
                  <DisabledAction icon={UserPlus} label="Assign" />
                  <DisabledAction icon={Check} label="Resolve" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}
