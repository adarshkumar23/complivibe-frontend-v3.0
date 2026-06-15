"use client";

import { LineChart, DollarSign, Waves, Cpu, type LucideIcon } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { Sparkline } from "@/components/charts/Sparkline";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { normalizeTelemetry, type TelemetrySeries } from "@/lib/api/ai-system-detail-normalizers";
import { ACCENTS, type Accent } from "@/components/ui/accent";
import type { AiSystemDetail } from "@/lib/hooks/useAiSystemDetail";

function Tile({
  label,
  icon,
  accent,
  t,
  suffix
}: {
  label: string;
  icon: LucideIcon;
  accent: Accent;
  t: TelemetrySeries;
  suffix?: string;
}) {
  const hasValue = t.value != null;
  const display = hasValue ? `${Math.round(t.value as number)}${t.unit ? "" : suffix ?? ""}` : "—";
  return (
    <div className="rounded-2xl bg-white/55 p-4 ring-1 ring-white/70">
      <div className="flex items-center justify-between">
        <IconTile icon={icon} accent={accent} size="sm" />
        <Sparkline data={t.series.length >= 2 ? t.series : null} color={ACCENTS[accent].hex} width={70} height={28} />
      </div>
      <p className="mt-3 text-[12px] font-semibold text-cv-slate">{label}</p>
      <p className="mt-0.5 flex items-baseline gap-1">
        <span className={`text-2xl font-extrabold leading-none ${hasValue ? "text-cv-ink" : "text-cv-mist"}`}>
          {t.unit && hasValue ? t.unit : ""}
          {display}
        </span>
      </p>
      {!hasValue && t.series.length < 2 ? <p className="mt-1 text-[10px] font-medium text-cv-mist">No telemetry yet</p> : null}
      {t.status ? <p className="mt-1 text-[11px] font-medium capitalize text-cv-slate">{t.status}</p> : null}
    </div>
  );
}

export function TelemetryPanel({ data }: { data: AiSystemDetail }) {
  const { cost, drift, reliability } = data;
  const c = normalizeTelemetry(cost.data, "cost");
  const d = normalizeTelemetry(drift.data, "drift");
  const r = normalizeTelemetry(reliability.data, "reliability");

  const loading = cost.isLoading && drift.isLoading && reliability.isLoading;
  const errored = cost.isError && drift.isError && reliability.isError;
  const hasAny =
    c.value != null || d.value != null || r.value != null || c.series.length + d.series.length + r.series.length > 0 || Boolean(c.status || d.status || r.status);

  return (
    <SectionCard title="Monitoring & Telemetry" subtitle="Cost, drift & reliability signals" icon={LineChart} accent="blue" className="h-full">
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : errored ? (
        <ErrorState title="Unable to load telemetry" onRetry={() => reliability.refetch()} />
      ) : !hasAny ? (
        <EmptyState
          icon={LineChart}
          title="No telemetry available"
          description="Cost, drift, and reliability charts will render here once monitoring data is reported."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Tile label="Cost" icon={DollarSign} accent="green" t={c} />
          <Tile label="Drift" icon={Waves} accent="amber" t={d} />
          <Tile label="Reliability" icon={Cpu} accent="blue" t={r} suffix="%" />
        </div>
      )}
    </SectionCard>
  );
}
