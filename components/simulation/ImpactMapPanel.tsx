"use client";

import { Network, GitBranch } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeSimulations } from "@/lib/api/simulation-normalizers";
import type { SimulationData } from "@/lib/hooks/useSimulation";

/** Aggregates affected areas reported by backend simulation results only — no invented cause-effect chains. */
export function ImpactMapPanel({ data }: { data: SimulationData }) {
  const { simulations } = data;
  const results = simulations.isSuccess ? normalizeSimulations(simulations.data) : [];

  const systems = new Set<string>();
  let evidence = 0, risks = 0, deadlines = 0, hasNumeric = false;
  for (const r of results) {
    for (const s of r.affectedSystems) systems.add(s);
    if (r.affectedEvidence != null) { evidence += r.affectedEvidence; hasNumeric = true; }
    if (r.affectedRisks != null) { risks += r.affectedRisks; hasNumeric = true; }
    if (r.affectedDeadlines != null) { deadlines += r.affectedDeadlines; hasNumeric = true; }
  }
  const hasImpact = systems.size > 0 || hasNumeric;

  const cells = [
    { label: "Affected systems", value: systems.size },
    { label: "Affected risks", value: risks },
    { label: "Affected evidence", value: evidence },
    { label: "Affected deadlines", value: deadlines }
  ];

  return (
    <SectionCard title="Impact Map" subtitle="Areas affected across backend results" icon={Network} accent="teal" className="h-full">
      {simulations.isLoading ? (
        <SkeletonRows rows={3} />
      ) : !hasImpact ? (
        <EmptyState icon={GitBranch} title="Impact map unavailable from backend." description="Affected systems, risks, evidence, and deadlines appear here once backend simulation results report impact." />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {cells.map((c) => (
            <div key={c.label} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70">
              <p className="text-[26px] font-extrabold leading-none text-cv-ink">{c.value}</p>
              <p className="mt-1 text-[11px] font-semibold text-cv-slate">{c.label}</p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
