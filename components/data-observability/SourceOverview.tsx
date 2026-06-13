"use client";

import { Database, Server } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeSources, isStale, isFailed } from "@/lib/api/data-observability-normalizers";
import { formatRelativeTime, scoreTone } from "@/lib/utils/format";
import type { Accent } from "@/components/ui/accent";
import type { DataObservability } from "@/lib/hooks/useDataObservability";

function statusTone(status: string | null, stale: boolean): "good" | "warn" | "bad" | "info" {
  if (stale || (status && isFailed(status))) return "bad";
  const s = (status || "").toLowerCase();
  if (["healthy", "ok", "active", "fresh", "passing", "up"].some((x) => s.includes(x))) return "good";
  if (["warn", "degraded", "delayed"].some((x) => s.includes(x))) return "warn";
  return "info";
}

export function SourceOverview({ data }: { data: DataObservability }) {
  const { sources } = data;
  const list = normalizeSources(sources.data);

  return (
    <SectionCard
      title="Source & Pipeline Overview"
      subtitle="Connected data sources and health"
      icon={Database}
      accent="cyan"
      className="h-full"
      action={
        sources.isSuccess ? (
          <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
            {list.length} sources
          </span>
        ) : null
      }
    >
      {sources.isLoading ? (
        <SkeletonRows rows={5} />
      ) : sources.isError ? (
        <ErrorState title="Unable to load sources" onRetry={() => sources.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Server}
          title="No data sources connected"
          description="Connected sources, their type, health, and freshness will appear here."
        />
      ) : (
        <ul className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
          {list.map((s) => {
            const stale = isStale(s);
            const tone = statusTone(s.status, stale);
            const accent: Accent = tone === "bad" ? "red" : tone === "warn" ? "amber" : tone === "good" ? "teal" : "blue";
            const fresh = formatRelativeTime(s.freshnessDate) || s.freshnessLabel;
            return (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <IconTile icon={Database} accent={accent} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-cv-ink">{s.name}</p>
                    <p className="truncate text-[12px] text-cv-slate">
                      {[s.type, s.owner].filter(Boolean).join(" · ") || "No type / owner"}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2.5">
                  {fresh ? <span className="hidden text-[11px] font-medium text-cv-mist lg:inline">{fresh}</span> : null}
                  {s.health != null ? (
                    <span
                      className={cnHealth(scoreTone(s.health))}
                    >
                      {Math.round(s.health)}
                    </span>
                  ) : null}
                  <StatusBadge label={s.status || (stale ? "Stale" : "Active")} tone={tone} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

function cnHealth(tone: "good" | "warn" | "bad") {
  const base = "hidden rounded-full px-2.5 py-1 text-xs font-bold ring-1 sm:inline ";
  return (
    base +
    (tone === "good"
      ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20"
      : tone === "warn"
        ? "bg-amber-400/12 text-amber-600 ring-amber-400/25"
        : "bg-rose-500/10 text-rose-600 ring-rose-500/20")
  );
}
