"use client";

import type { LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { IconTile } from "@/components/ui/IconTile";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import type { Accent } from "@/components/ui/accent";
import { cn } from "@/lib/utils/cn";
import { scoreTone } from "@/lib/utils/format";

type Tone = "good" | "warn" | "bad" | "neutral";

const toneText: Record<Tone, string> = {
  good: "text-emerald-600",
  warn: "text-amber-600",
  bad: "text-rose-600",
  neutral: "text-cv-ink"
};

/**
 * Compact KPI tile sharing the approved StatCard/RegistryKpi look. Renders either a numeric
 * score (tone-coloured) or a short categorical label (e.g. risk level / drift status).
 */
export function DetailKpi({
  label,
  icon,
  accent = "blue",
  value,
  suffix = "",
  scoreToneFor,
  text,
  textTone = "neutral",
  loading = false,
  unavailableHint = "Unavailable"
}: {
  label: string;
  icon: LucideIcon;
  accent?: Accent;
  value?: number | null;
  suffix?: string;
  scoreToneFor?: number | null;
  text?: string | null;
  textTone?: Tone;
  loading?: boolean;
  unavailableHint?: string;
}) {
  const isText = text !== undefined;
  const hasValue = isText ? Boolean(text) : value != null && Number.isFinite(value);
  const numberColor = scoreToneFor != null ? toneText[scoreTone(scoreToneFor)] : "text-cv-ink";

  return (
    <GlassCard hover className="flex flex-col gap-3 p-4">
      <IconTile icon={icon} accent={accent} size="sm" />
      <div>
        <p className="text-[12px] font-semibold text-cv-slate">{label}</p>
        {loading ? (
          <LoadingSkeleton className="mt-2 h-7 w-20" />
        ) : hasValue ? (
          isText ? (
            <p className={cn("mt-1 text-xl font-extrabold capitalize leading-tight", toneText[textTone])}>{text}</p>
          ) : (
            <p className="mt-1 flex items-baseline gap-1">
              <span className={cn("text-[28px] font-extrabold leading-none tracking-tight", numberColor)}>
                {Math.round(value as number)}
              </span>
              {suffix ? <span className="text-xs font-semibold text-cv-mist">{suffix}</span> : null}
            </p>
          )
        ) : (
          <div className="mt-1.5">
            <span className="text-2xl font-extrabold leading-none text-cv-mist">—</span>
            <p className="mt-1 inline-flex items-center rounded-full bg-slate-400/10 px-2 py-0.5 text-[10px] font-semibold text-cv-slate ring-1 ring-slate-400/15">
              {unavailableHint}
            </p>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
