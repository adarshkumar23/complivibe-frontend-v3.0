"use client";

import { useMemo, useState } from "react";
import { Search, Activity, Cpu } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeTelemetry, reliabilitySignals, costSignal, reliabilityTone, isActiveMonitoring } from "@/lib/api/ai-monitoring-normalizers";
import type { AiMonitoringData } from "@/lib/hooks/useAiMonitoring";
import type { NormalizedAiSystem } from "@/lib/api/ai-system-normalizers";

function TelemetryCells({ system, data }: { system: NormalizedAiSystem; data: AiMonitoringData }) {
  const rel = system.rawId ? data.reliabilityById.get(system.rawId) : undefined;
  const cost = system.rawId ? data.costById.get(system.rawId) : undefined;

  if (!system.rawId || (rel?.isError && cost?.isError)) {
    return <span className="text-[11px] font-medium text-cv-mist">Telemetry unavailable</span>;
  }
  if ((rel && rel.isLoading) || (cost && cost.isLoading)) {
    return <span className="text-[11px] text-cv-mist">Loading…</span>;
  }

  const relBase = rel?.isSuccess ? normalizeTelemetry(rel.data, "reliability") : null;
  const r = rel?.isSuccess ? reliabilitySignals(rel.data, relBase!) : null;
  const cBase = cost?.isSuccess ? normalizeTelemetry(cost.data, "cost") : null;
  const c = cost?.isSuccess ? costSignal(cost.data, cBase!) : null;

  const hasAny = (r && (r.reliability != null || r.status || r.latency != null || r.errorRate != null)) || (c && c.value != null);
  if (!hasAny) return <span className="text-[11px] font-medium text-cv-mist">No telemetry</span>;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {r?.latency != null ? <span className="text-[11px] text-cv-slate">{Math.round(r.latency)}ms</span> : null}
      {r?.errorRate != null ? <span className="text-[11px] text-cv-slate">{r.errorRate}% err</span> : null}
      {c?.value != null ? <span className="text-[11px] text-cv-slate">{c.unit ? `${c.unit} ` : ""}{Math.round(c.value)}</span> : null}
      {r?.reliability != null ? (
        <StatusBadge label={`${Math.round(r.reliability)}${r.unit === "%" ? "%" : ""} reliable`} tone={reliabilityTone(r.reliability)} />
      ) : r?.status ? (
        <StatusBadge label={r.status} tone="info" />
      ) : null}
    </div>
  );
}

export function MonitoringOverviewTable({ data }: { data: AiMonitoringData }) {
  const { systems, list } = data;
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((s) => [s.name, s.owner].filter(Boolean).some((v) => (v as string).toLowerCase().includes(q)));
  }, [list, query]);

  return (
    <SectionCard
      title="Monitoring Overview"
      subtitle="Live reliability & cost telemetry per system"
      icon={Activity}
      accent="blue"
      action={systems.isSuccess ? <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">{list.length} systems</span> : null}
    >
      {systems.isLoading ? (
        <SkeletonRows rows={6} />
      ) : systems.isError ? (
        <ErrorState title="Unable to load AI systems" onRetry={() => systems.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon={Cpu} title="No AI systems returned" description="Monitored AI systems and their telemetry will appear here once the backend provides them." />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5 rounded-full bg-white/60 px-4 py-2.5 ring-1 ring-white/70 focus-within:ring-cv-blue/40">
            <Search size={16} className="shrink-0 text-cv-mist" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search systems, owners..." className="min-w-0 flex-1 bg-transparent text-sm text-cv-ink placeholder:text-cv-mist focus:outline-none" />
          </div>

          {filtered.length === 0 ? (
            <EmptyState compact icon={Search} title="No systems match your search" description="Try a different term." />
          ) : (
            <ul className="max-h-[560px] space-y-2.5 overflow-y-auto pr-1">
              {filtered.map((s) => (
                <li key={s.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <IconTile icon={Cpu} accent="blue" size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-cv-ink">{s.name}</p>
                        <p className="truncate text-[11px] text-cv-slate">{s.owner || "No owner"}</p>
                      </div>
                    </div>
                    {s.lifecycleStage ? (
                      <StatusBadge label={s.lifecycleStage} tone={isActiveMonitoring(s.lifecycleStage) ? "good" : "neutral"} />
                    ) : null}
                  </div>
                  <div className="mt-2 flex justify-end pl-12">
                    <TelemetryCells system={s} data={data} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </SectionCard>
  );
}
