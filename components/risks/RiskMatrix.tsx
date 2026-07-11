"use client";

import { Grid3x3 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { cn } from "@/lib/utils/cn";
import type { RisksData } from "@/lib/hooks/useRisks";

/** Cell color scales with likelihood × impact zone, intensity with count. */
function cellClasses(likelihood: number, impact: number, count: number): string {
  const zone = likelihood * impact;
  if (count === 0) return "bg-slate-400/8 text-cv-mist";
  if (zone >= 15) return "bg-rose-500/75 text-white";
  if (zone >= 8) return "bg-amber-400/80 text-white";
  return "bg-emerald-500/70 text-white";
}

/** 5×5 likelihood/impact matrix from GET /api/v1/risks/heatmap. */
export function RiskMatrix({ data }: { data: RisksData }) {
  const { heatmap } = data;
  const cells = heatmap.data?.matrix ?? [];
  const total = cells.reduce((s, c) => s + c.count, 0);
  const byKey = new Map(cells.map((c) => [`${c.likelihood}-${c.impact}`, c]));

  return (
    <SectionCard
      title="Risk Matrix"
      subtitle="Likelihood × impact distribution"
      icon={Grid3x3}
      accent="red"
      className="h-full"
    >
      {heatmap.isLoading ? (
        <LoadingSkeleton className="h-52 w-full" />
      ) : heatmap.isError ? (
        <ErrorState compact title="Unable to load risk matrix" onRetry={() => heatmap.refetch()} />
      ) : total === 0 ? (
        <EmptyState compact icon={Grid3x3} title="No plotted risks" description="Risks with likelihood and impact scores will plot here." />
      ) : (
        <div className="flex gap-2">
          <div className="flex flex-col justify-between py-1 text-[10px] font-semibold text-cv-mist">
            <span className="-rotate-90">High</span>
            <span className="-rotate-90">Low</span>
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-5 gap-1.5">
              {[5, 4, 3, 2, 1].map((likelihood) =>
                [1, 2, 3, 4, 5].map((impact) => {
                  const cell = byKey.get(`${likelihood}-${impact}`);
                  const count = cell?.count ?? 0;
                  const names = cell?.risks.map((r) => r.title).join(", ");
                  return (
                    <div
                      key={`${likelihood}-${impact}`}
                      title={names || `Likelihood ${likelihood}, impact ${impact}`}
                      className={cn(
                        "flex aspect-square items-center justify-center rounded-lg text-sm font-extrabold transition",
                        cellClasses(likelihood, impact, count)
                      )}
                    >
                      {count > 0 ? count : ""}
                    </div>
                  );
                })
              )}
            </div>
            <p className="mt-1.5 text-center text-[10px] font-semibold text-cv-mist">Impact →</p>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
