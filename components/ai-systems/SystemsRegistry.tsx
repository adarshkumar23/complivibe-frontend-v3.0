"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Cpu, Boxes, ChevronRight } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime, scoreTone } from "@/lib/utils/format";
import { normalizeAiSystems } from "@/lib/api/ai-system-normalizers";
import type { Accent } from "@/components/ui/accent";
import type { Severity } from "@/lib/api/types";
import type { AiSystemsData } from "@/lib/hooks/useAiSystems";

type RiskFilter = "all" | "high" | "medium" | "low";

const RISK_FILTERS: { id: RiskFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" }
];

const riskAccent: Record<Severity, Accent> = {
  critical: "red",
  high: "red",
  medium: "amber",
  low: "green",
  info: "blue"
};

function matchRisk(filter: RiskFilter, risk: Severity, hasRisk: boolean): boolean {
  if (filter === "all") return true;
  if (!hasRisk) return false;
  if (filter === "high") return risk === "critical" || risk === "high";
  return risk === filter;
}

export function SystemsRegistry({ data }: { data: AiSystemsData }) {
  const { systems } = data;
  const list = useMemo(() => normalizeAiSystems(systems.data), [systems.data]);

  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState<RiskFilter>("all");
  const [lifecycle, setLifecycle] = useState<string>("all");

  const lifecycleOptions = useMemo(() => {
    const set = new Set<string>();
    list.forEach((s) => s.lifecycleStage && set.add(s.lifecycleStage));
    return [...set];
  }, [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((s) => {
      if (!matchRisk(risk, s.riskLevel, s.hasRisk)) return false;
      if (lifecycle !== "all" && s.lifecycleStage !== lifecycle) return false;
      if (!q) return true;
      return [s.name, s.owner, s.useCase].filter(Boolean).some((v) => (v as string).toLowerCase().includes(q));
    });
  }, [list, query, risk, lifecycle]);

  const inputCls =
    "flex min-w-0 flex-1 items-center gap-2.5 rounded-full bg-white/60 px-4 py-2.5 ring-1 ring-white/70 focus-within:ring-cv-blue/40";

  return (
    <SectionCard
      title="AI Systems Registry"
      subtitle="Every registered model, owner, and risk signal"
      icon={Boxes}
      accent="purple"
      className="h-full"
      action={
        systems.isSuccess ? (
          <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
            {list.length} total
          </span>
        ) : null
      }
    >
      {systems.isLoading ? (
        <SkeletonRows rows={6} />
      ) : systems.isError ? (
        <ErrorState title="Unable to load AI systems" onRetry={() => systems.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Cpu}
          title="No AI systems registered"
          description="Registered AI systems, their owners, lifecycle stage, and risk levels will appear here."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className={inputCls}>
              <Search size={16} className="shrink-0 text-cv-mist" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search systems, owners, use cases..."
                className="min-w-0 flex-1 bg-transparent text-sm text-cv-ink placeholder:text-cv-mist focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1 rounded-full bg-white/55 p-1 ring-1 ring-white/70">
              {RISK_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setRisk(f.id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                    risk === f.id ? "bg-cv-brand text-white shadow-button" : "text-cv-slate hover:text-cv-ink"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {lifecycleOptions.length > 0 ? (
              <select
                value={lifecycle}
                onChange={(e) => setLifecycle(e.target.value)}
                className="cv-ring-focus rounded-full bg-white/60 px-4 py-2.5 text-sm font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none"
              >
                <option value="all">All stages</option>
                {lifecycleOptions.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <EmptyState compact icon={Search} title="No systems match your filters" description="Try adjusting search or risk filters." />
          ) : (
            <ul className="max-h-[460px] space-y-2.5 overflow-y-auto pr-1">
              {filtered.map((s) => {
                const tone = scoreTone(s.score);
                const time = formatRelativeTime(s.lastAssessed);
                const rowCls =
                  "flex items-center justify-between gap-3 rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85";
                const content = (
                  <>
                    <div className="flex min-w-0 items-center gap-3">
                      <IconTile icon={Cpu} accent={riskAccent[s.riskLevel]} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-cv-ink">{s.name}</p>
                        <p className="truncate text-[12px] text-cv-slate">
                          {[s.owner, s.useCase].filter(Boolean).join(" · ") || "No owner / use case"}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5">
                      {time ? <span className="hidden text-[11px] font-medium text-cv-mist lg:inline">{time}</span> : null}
                      {s.score != null ? (
                        <span
                          className={cn(
                            "hidden rounded-full px-2.5 py-1 text-xs font-bold ring-1 sm:inline",
                            tone === "good"
                              ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20"
                              : tone === "warn"
                                ? "bg-amber-400/12 text-amber-600 ring-amber-400/25"
                                : "bg-rose-500/10 text-rose-600 ring-rose-500/20"
                          )}
                        >
                          {Math.round(s.score)}
                        </span>
                      ) : null}
                      {s.lifecycleStage ? <StatusBadge label={s.lifecycleStage} tone="info" /> : null}
                      {s.hasRisk ? <SeverityBadge severity={s.riskLevel} /> : null}
                      {s.rawId ? <ChevronRight size={16} className="text-cv-mist" /> : null}
                    </div>
                  </>
                );
                return (
                  <li key={s.id}>
                    {s.rawId ? (
                      <Link href={`/dashboard/ai-systems/${encodeURIComponent(s.rawId)}`} className={cn(rowCls, "cursor-pointer")}>
                        {content}
                      </Link>
                    ) : (
                      <div className={rowCls}>{content}</div>
                    )}
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
