"use client";

import Link from "next/link";
import { LayoutGrid, ArrowUpRight, Plug, Database as DatabaseIcon, AlertCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { IconTile } from "@/components/ui/IconTile";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ACCENTS } from "@/components/ui/accent";
import { cn } from "@/lib/utils/cn";
import type { CoverageItem, GovernanceCoverage } from "@/lib/hooks/useGovernanceCoverage";

const STATUS_LABEL: Record<CoverageItem["status"], string> = {
  loading: "Checking…",
  available: "Records available",
  empty: "No records returned",
  unavailable: "Unavailable"
};

function StatusBadge({ status }: { status: CoverageItem["status"] }) {
  const styles: Record<CoverageItem["status"], string> = {
    loading: "bg-slate-400/10 text-cv-slate ring-slate-400/20",
    available: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20",
    empty: "bg-amber-500/10 text-amber-600 ring-amber-500/20",
    unavailable: "bg-rose-500/10 text-rose-600 ring-rose-500/20"
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1", styles[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function CoverageCard({ item }: { item: CoverageItem }) {
  const accent = ACCENTS[item.accent];
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl bg-white/55 p-4 ring-1 ring-white/70 outline-none transition",
        "hover:bg-white/85 hover:shadow-glass-hover",
        "focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <IconTile icon={item.icon} accent={item.accent} size="sm" />
        <ArrowUpRight size={16} className="text-cv-mist transition group-hover:text-cv-ink" />
      </div>

      <div>
        <p className="text-[13px] font-bold leading-tight text-cv-ink">{item.label}</p>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          {item.status === "loading" ? (
            <LoadingSkeleton className="h-7 w-14" />
          ) : item.status === "unavailable" ? (
            <span className="text-2xl font-extrabold leading-none text-cv-mist">—</span>
          ) : item.count != null ? (
            <span className={cn("text-2xl font-extrabold leading-none tracking-tight", accent.text)}>
              {item.count.toLocaleString()}
            </span>
          ) : (
            <span className={cn("text-base font-extrabold leading-none", accent.text)}>Available</span>
          )}
          {item.count != null && item.count > 0 ? (
            <span className="text-[11px] font-semibold text-cv-mist">records</span>
          ) : null}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2">
        <StatusBadge status={item.status} />
      </div>
      {item.note ? <p className="text-[10px] font-medium text-cv-mist">{item.note}</p> : null}
    </Link>
  );
}

function StatPill({
  icon: Icon,
  value,
  label,
  tone
}: {
  icon: typeof Plug;
  value: number | string;
  label: string;
  tone: "good" | "neutral" | "bad";
}) {
  const toneCls =
    tone === "good"
      ? "text-emerald-600"
      : tone === "bad"
        ? "text-rose-600"
        : "text-cv-ink";
  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-white/55 px-3.5 py-2 ring-1 ring-white/70">
      <Icon size={16} className="text-cv-slate" />
      <span className={cn("text-sm font-extrabold tabular-nums", toneCls)}>{value}</span>
      <span className="text-[11px] font-medium text-cv-slate">{label}</span>
    </div>
  );
}

export function CoverageMap({ coverage }: { coverage: GovernanceCoverage }) {
  const { items, summary } = coverage;

  return (
    <GlassCard className="flex flex-col p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconTile icon={LayoutGrid} accent="blue" size="sm" />
          <div>
            <h3 className="text-[15px] font-bold leading-tight text-cv-ink">Governance Coverage Map</h3>
            <p className="mt-0.5 text-xs text-cv-slate">Real records available across the demo workspace.</p>
          </div>
        </div>

        {/* Source status strip */}
        <div className="flex flex-wrap items-center gap-2">
          <StatPill
            icon={Plug}
            value={summary.loading ? "…" : `${summary.connectedSources}/${summary.totalSources}`}
            label="Connected sources"
            tone="good"
          />
          <StatPill
            icon={DatabaseIcon}
            value={summary.loading ? "…" : summary.availableRecords.toLocaleString()}
            label="Available records"
            tone="neutral"
          />
          <StatPill
            icon={AlertCircle}
            value={summary.loading ? "…" : summary.unavailableSources}
            label="Unavailable sources"
            tone={summary.unavailableSources > 0 ? "bad" : "neutral"}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {items.map((item) => (
          <CoverageCard key={item.id} item={item} />
        ))}
      </div>
    </GlassCard>
  );
}
