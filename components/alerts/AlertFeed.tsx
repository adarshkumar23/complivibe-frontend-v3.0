"use client";

import { useMemo, useState } from "react";
import { Search, Bell, BellOff } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { buildAlertFeed, sortBySeverity } from "@/lib/api/alert-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Accent } from "@/components/ui/accent";
import type { Severity } from "@/lib/api/types";
import type { AlertsData } from "@/lib/hooks/useAlerts";

type SeverityFilter = "all" | "critical" | "high" | "medium" | "low";
const SEV_FILTERS: { id: SeverityFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "critical", label: "Critical" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" }
];

const sevAccent: Record<Severity, Accent> = { critical: "red", high: "red", medium: "amber", low: "green", info: "blue" };

export function AlertFeed({ data }: { data: AlertsData }) {
  const { insights, predictive } = data;
  const feed = useMemo(() => sortBySeverity(buildAlertFeed(insights.data, predictive.data)), [insights.data, predictive.data]);

  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [source, setSource] = useState<"all" | "Proactive" | "Predictive">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return feed.filter((a) => {
      if (severity !== "all" && a.severity !== severity) return false;
      if (source !== "all" && a.source !== source) return false;
      if (!q) return true;
      return [a.title, a.description].filter(Boolean).some((v) => (v as string).toLowerCase().includes(q));
    });
  }, [feed, query, severity, source]);

  const loading = insights.isLoading && predictive.isLoading;
  const errored = insights.isError && predictive.isError;

  return (
    <SectionCard
      title="Alert Feed"
      subtitle="Proactive & predictive signals"
      icon={Bell}
      accent="amber"
      className="h-full"
      action={insights.isSuccess || predictive.isSuccess ? <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">{feed.length}</span> : null}
    >
      {loading ? (
        <SkeletonRows rows={6} />
      ) : errored ? (
        <ErrorState title="Unable to load alerts" onRetry={() => { insights.refetch(); predictive.refetch(); }} />
      ) : feed.length === 0 ? (
        <EmptyState icon={BellOff} title="No alerts" description="You're all clear — no proactive or predictive alerts right now." />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 rounded-full bg-white/60 px-4 py-2.5 ring-1 ring-white/70 focus-within:ring-cv-blue/40">
              <Search size={16} className="shrink-0 text-cv-mist" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search alerts..." className="min-w-0 flex-1 bg-transparent text-sm text-cv-ink placeholder:text-cv-mist focus:outline-none" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-white/55 p-1 ring-1 ring-white/70">
                {SEV_FILTERS.map((f) => (
                  <button key={f.id} type="button" onClick={() => setSeverity(f.id)} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition", severity === f.id ? "bg-cv-brand text-white shadow-button" : "text-cv-slate hover:text-cv-ink")}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 rounded-full bg-white/55 p-1 ring-1 ring-white/70">
                {(["all", "Proactive", "Predictive"] as const).map((s) => (
                  <button key={s} type="button" onClick={() => setSource(s)} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition", source === s ? "bg-cv-brand text-white shadow-button" : "text-cv-slate hover:text-cv-ink")}>
                    {s === "all" ? "All sources" : s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState compact icon={Search} title="No alerts match your filters" description="Try adjusting search or filters." />
          ) : (
            <ul className="max-h-[520px] space-y-2.5 overflow-y-auto pr-1">
              {filtered.map((a) => {
                const time = formatRelativeTime(a.timestamp);
                return (
                  <li key={`${a.source}-${a.id}`} className="rounded-2xl bg-white/55 p-3.5 ring-1 ring-white/70 transition hover:bg-white/85">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <IconTile icon={Bell} accent={a.hasSeverity ? sevAccent[a.severity] : "blue"} size="sm" />
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold leading-snug text-cv-ink">{a.title}</p>
                          {a.description ? <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-cv-slate">{a.description}</p> : null}
                          <p className="mt-1 flex items-center gap-2 text-[11px] font-medium text-cv-mist">
                            <span className="rounded-full bg-white/70 px-2 py-0.5 ring-1 ring-slate-200/70">{a.source}</span>
                            {a.confidence != null ? <span>{Math.round(a.confidence)}% confidence</span> : null}
                            {time ? <span>{time}</span> : null}
                          </p>
                        </div>
                      </div>
                      {a.hasSeverity ? (
                        <SeverityBadge severity={a.severity} />
                      ) : (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-400/10 px-2.5 py-1 text-xs font-semibold text-cv-slate ring-1 ring-slate-400/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          Unclassified
                        </span>
                      )}
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
