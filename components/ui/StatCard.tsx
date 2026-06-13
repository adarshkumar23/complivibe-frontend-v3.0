"use client";

import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { IconTile } from "@/components/ui/IconTile";
import { Sparkline } from "@/components/charts/Sparkline";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ACCENTS, type Accent } from "@/components/ui/accent";
import { cn } from "@/lib/utils/cn";
import { scoreTone } from "@/lib/utils/format";

type StatCardProps = {
  label: string;
  value: number | null | undefined;
  icon: LucideIcon;
  accent?: Accent;
  suffix?: string;
  /** real trend series; omitted when backend has none */
  trend?: number[] | null;
  delta?: number | null;
  loading?: boolean;
  /** caption shown when value is unavailable */
  unavailableHint?: string;
};

export function StatCard({
  label,
  value,
  icon,
  accent = "blue",
  suffix = "/100",
  trend,
  delta,
  loading = false,
  unavailableHint = "Awaiting backend data"
}: StatCardProps) {
  const hasValue = value != null && Number.isFinite(value);
  const tone = scoreTone(value ?? null);
  const toneText =
    tone === "good" ? "text-emerald-600" : tone === "warn" ? "text-amber-600" : "text-rose-600";

  return (
    <GlassCard hover className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between">
        <IconTile icon={icon} accent={accent} size="md" />
        {hasValue && delta != null ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ring-1",
              delta >= 0
                ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20"
                : "bg-rose-500/10 text-rose-600 ring-rose-500/20"
            )}
          >
            {delta >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {Math.abs(delta)}
          </span>
        ) : null}
      </div>

      <div>
        <p className="text-[13px] font-semibold text-cv-slate">{label}</p>
        {loading ? (
          <LoadingSkeleton className="mt-2 h-9 w-24" />
        ) : hasValue ? (
          <p className="mt-1 flex items-baseline gap-1">
            <span className={cn("text-[34px] font-extrabold leading-none tracking-tight", toneText)}>
              {Math.round(value as number)}
            </span>
            <span className="text-sm font-semibold text-cv-mist">{suffix}</span>
          </p>
        ) : (
          <div className="mt-1.5">
            <span className="text-3xl font-extrabold leading-none text-cv-mist">—</span>
            <p className="mt-1.5 inline-flex items-center rounded-full bg-slate-400/10 px-2 py-0.5 text-[11px] font-semibold text-cv-slate ring-1 ring-slate-400/15">
              {unavailableHint}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <span className="text-[11px] font-medium text-cv-mist">
          {hasValue ? (tone === "good" ? "Healthy" : tone === "warn" ? "Needs attention" : "At risk") : "No signal yet"}
        </span>
        {loading ? (
          <LoadingSkeleton className="h-8 w-24" />
        ) : (
          <Sparkline data={hasValue ? trend : null} color={ACCENTS[accent].hex} />
        )}
      </div>
    </GlassCard>
  );
}
