"use client";

import { History, Clock } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeSimulations, impactTone } from "@/lib/api/simulation-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { SimulationData } from "@/lib/hooks/useSimulation";

export function HistoricalSimulationsPanel({ data }: { data: SimulationData }) {
  const { simulations } = data;
  const results = simulations.isSuccess
    ? normalizeSimulations(simulations.data).slice().sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    : [];

  return (
    <SectionCard title="Historical Simulations" subtitle="Past backend simulation runs" icon={History} accent="purple">
      {simulations.isLoading ? (
        <SkeletonRows rows={4} />
      ) : results.length === 0 ? (
        <EmptyState icon={Clock} title="Simulation history unavailable from backend." description="Previously executed scenario runs will appear here once a simulation backend records them." />
      ) : (
        <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {results.slice(0, 12).map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{r.name}</p>
                <p className="truncate text-[11px] text-cv-slate">{[r.scenarioType, formatRelativeTime(r.createdAt)].filter(Boolean).join(" · ") || "—"}</p>
              </div>
              {r.impactScore != null ? <StatusBadge label={`Impact ${Math.round(r.impactScore)}`} tone={impactTone(r.impactScore)} /> : r.status ? <StatusBadge label={r.status} tone="neutral" /> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
