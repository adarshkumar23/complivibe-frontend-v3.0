"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { IconTile } from "@/components/ui/IconTile";
import { Sparkline } from "@/components/charts/Sparkline";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ACCENTS, type Accent } from "@/components/ui/accent";
import { cn } from "@/lib/utils/cn";
import { scoreTone } from "@/lib/utils/format";

/**
 * KPI card sharing StatCard's exact visual language, but able to render real *counts*
 * (neutral ink) as well as *scores* (tone-coloured). No StatCard styling was modified.
 */
export function RegistryKpi({
  label,
  icon,
  accent = "blue",
  value,
  suffix = "",
  scoreToneFor,
  caption,
  loading = false,
  unavailableHint = "Backend field missing",
  action
}: {
  label: string;
  icon: LucideIcon;
  accent?: Accent;
  /** the displayed number, or null for the unavailable state */
  value: number | null | undefined;
  suffix?: string;
  /** when provided, colour the number by score tone instead of neutral ink */
  scoreToneFor?: number | null;
  caption?: string;
  loading?: boolean;
  unavailableHint?: string;
  /** optional element rendered in the card's top-right corner (e.g. a quick action) */
  action?: ReactNode;
}) {
  const hasValue = value != null && Number.isFinite(value);
  const useScoreTone = scoreToneFor != null;
  const tone = scoreTone(scoreToneFor ?? null);
  const numberColor = !hasValue
    ? "text-cv-mist"
    : useScoreTone
      ? tone === "good"
        ? "text-emerald-600"
        : tone === "warn"
          ? "text-amber-600"
          : "text-rose-600"
      : "text-cv-ink";

  return (
    <GlassCard hover className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between">
        <IconTile icon={icon} accent={accent} size="md" />
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div>
        <p className="text-[13px] font-semibold text-cv-slate">{label}</p>
        {loading ? (
          <LoadingSkeleton className="mt-2 h-9 w-24" />
        ) : hasValue ? (
          <p className="mt-1 flex items-baseline gap-1">
            <span className={cn("text-[34px] font-extrabold leading-none tracking-tight", numberColor)}>
              {Math.round(value as number)}
            </span>
            {suffix ? <span className="text-sm font-semibold text-cv-mist">{suffix}</span> : null}
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
        <span className="text-[11px] font-medium text-cv-mist">{hasValue ? (caption ?? "") : "No signal yet"}</span>
        {loading ? (
          <LoadingSkeleton className="h-8 w-24" />
        ) : (
          <Sparkline data={null} color={ACCENTS[accent].hex} />
        )}
      </div>
    </GlassCard>
  );
}
