"use client";

import { Activity, Lightbulb } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeSimulations, impactTone } from "@/lib/api/simulation-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { SimulationData } from "@/lib/hooks/useSimulation";

export function SimulationResultsPanel({ data }: { data: SimulationData }) {
  const { simulations } = data;
  const results = simulations.isSuccess ? normalizeSimulations(simulations.data) : [];

  return (
    <SectionCard title="Simulation Results" subtitle="Backend-produced scenario outcomes" icon={Activity} accent="purple" className="h-full">
      {simulations.isLoading ? (
        <SkeletonRows rows={4} />
      ) : results.length === 0 ? (
        <EmptyState icon={Activity} title="Simulation results unavailable from backend." description="Scenario outcomes, impact scores, and recommended actions will appear here once a simulation backend produces them." />
      ) : (
        <ul className="max-h-[460px] space-y-3 overflow-y-auto pr-1">
          {results.slice(0, 10).map((r) => (
            <li key={r.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-cv-ink">{r.name}</p>
                  <p className="truncate text-[11px] text-cv-slate">{[r.scenarioType, r.createdAt ? formatDate(r.createdAt) : null].filter(Boolean).join(" · ") || "—"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {r.impactScore != null ? <StatusBadge label={`Impact ${Math.round(r.impactScore)}`} tone={impactTone(r.impactScore)} /> : null}
                  {r.status ? <StatusBadge label={r.status} tone="neutral" /> : null}
                </div>
              </div>
              {(r.affectedSystems.length > 0 || r.affectedEvidence != null || r.affectedRisks != null || r.affectedDeadlines != null) ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.affectedSystems.length > 0 ? <Chip label={`${r.affectedSystems.length} systems`} /> : null}
                  {r.affectedRisks != null ? <Chip label={`${r.affectedRisks} risks`} /> : null}
                  {r.affectedEvidence != null ? <Chip label={`${r.affectedEvidence} evidence`} /> : null}
                  {r.affectedDeadlines != null ? <Chip label={`${r.affectedDeadlines} deadlines`} /> : null}
                </div>
              ) : null}
              {r.recommendations.length > 0 ? (
                <ul className="mt-2 space-y-1.5 border-t border-white/50 pt-2">
                  {r.recommendations.slice(0, 4).map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] font-medium text-cv-slate"><Lightbulb size={13} className="mt-0.5 shrink-0 text-amber-500" /> <span className="min-w-0">{rec}</span></li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function Chip({ label }: { label: string }) {
  return <span className="inline-flex items-center rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-cv-slate ring-1 ring-white/60">{label}</span>;
}
