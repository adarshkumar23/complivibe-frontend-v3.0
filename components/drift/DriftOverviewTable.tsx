"use client";

import { useMemo, useState } from "react";
import { Search, Waves, Cpu } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeTelemetry, driftDetail, driftTone } from "@/lib/api/drift-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { DriftData } from "@/lib/hooks/useDrift";
import type { NormalizedAiSystem } from "@/lib/api/ai-system-normalizers";

function DriftCells({ system, data }: { system: NormalizedAiSystem; data: DriftData }) {
  const e = system.rawId ? data.driftById.get(system.rawId) : undefined;

  if (!system.rawId || e?.isError) {
    return <span className="text-[11px] font-medium text-cv-mist">Drift telemetry unavailable</span>;
  }
  if (!e || e.isLoading) {
    return <span className="text-[11px] text-cv-mist">Loading…</span>;
  }
  const base = normalizeTelemetry(e.data, "drift");
  const d = driftDetail(e.data, base.value, base.status);
  const hasAny = d.score != null || d.status != null || d.featureDrift != null || d.modelDrift != null || d.severity != null;
  if (!hasAny) return <span className="text-[11px] font-medium text-cv-mist">No drift data</span>;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {d.score != null ? <span className="text-[11px] font-semibold text-cv-slate">score {d.score}</span> : null}
      {d.featureDrift != null ? <span className="text-[11px] text-cv-mist">feat {d.featureDrift}</span> : null}
      {d.modelDrift != null ? <span className="text-[11px] text-cv-mist">model {d.modelDrift}</span> : null}
      {d.lastChecked ? <span className="text-[11px] text-cv-mist">{formatDate(d.lastChecked)}</span> : null}
      {d.severity ? <StatusBadge label={d.severity} tone={driftTone(d)} /> : d.status ? <StatusBadge label={d.status} tone={driftTone(d)} /> : null}
    </div>
  );
}

export function DriftOverviewTable({ data }: { data: DriftData }) {
  const { systems, list } = data;
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((s) => [s.name, s.owner].filter(Boolean).some((v) => (v as string).toLowerCase().includes(q)));
  }, [list, query]);

  return (
    <SectionCard
      title="Drift Overview"
      subtitle="Model & data drift per system"
      icon={Waves}
      accent="blue"
      action={systems.isSuccess ? <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">{list.length} systems</span> : null}
    >
      {systems.isLoading ? (
        <SkeletonRows rows={6} />
      ) : systems.isError ? (
        <ErrorState title="Unable to load AI systems" onRetry={() => systems.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon={Cpu} title="No AI systems returned" description="AI systems and their drift status will appear here once the backend provides them." />
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
                  </div>
                  <div className="mt-2 flex justify-end pl-12">
                    <DriftCells system={s} data={data} />
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
