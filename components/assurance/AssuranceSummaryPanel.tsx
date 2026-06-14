"use client";

import { GaugeCircle } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { ScoreRing } from "@/components/charts/ScoreRing";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeAssuranceSummary } from "@/lib/api/assurance-normalizers";
import type { AssuranceData } from "@/lib/hooks/useAssurance";

function Tile({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-xl bg-white/55 px-3 py-2.5 text-center ring-1 ring-white/60">
      <p className={`text-lg font-extrabold leading-none ${value != null ? "text-cv-ink" : "text-cv-mist"}`}>{value != null ? value : "—"}</p>
      <p className="mt-1 text-[10px] font-medium text-cv-slate">{label}</p>
    </div>
  );
}

export function AssuranceSummaryPanel({ data }: { data: AssuranceData }) {
  const { summary } = data;
  const s = normalizeAssuranceSummary(summary.data);

  return (
    <SectionCard title="Assurance Summary" subtitle="Review program at a glance" icon={GaugeCircle} accent="teal" className="h-full">
      {summary.isLoading ? (
        <SkeletonRows rows={4} />
      ) : !s.hasAny ? (
        <EmptyState icon={GaugeCircle} title="Assurance summary unavailable from backend." description="Review counts, completion, and coverage will appear here once the summary endpoint returns data." />
      ) : (
        <div className="flex flex-col items-center gap-4">
          {s.coverage != null ? <ScoreRing value={s.coverage} size={120} label="Coverage" /> : null}
          <div className="grid w-full grid-cols-2 gap-2.5">
            <Tile label="Open cases" value={s.openCases} />
            <Tile label="Awaiting sign-off" value={s.awaitingSignoff} />
            <Tile label="Completed" value={s.completed} />
            <Tile label="Evidence in review" value={s.evidenceUnderReview} />
          </div>
        </div>
      )}
    </SectionCard>
  );
}
