"use client";

import { Grid3x3 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { normalizeRisks, buildRiskMatrix } from "@/lib/api/risk-normalizers";
import type { RisksData } from "@/lib/hooks/useRisks";

function cellColor(impact: number, likelihood: number): string {
  const product = impact * likelihood; // 1..25
  if (product <= 5) return "rgba(16,185,129,0.18)";
  if (product <= 10) return "rgba(245,158,11,0.20)";
  if (product <= 16) return "rgba(249,115,22,0.24)";
  return "rgba(239,68,68,0.26)";
}

export function RiskMatrix({ data }: { data: RisksData }) {
  const { risks } = data;
  const list = normalizeRisks(risks.data);
  const matrix = buildRiskMatrix(list);

  return (
    <SectionCard title="Risk Matrix" subtitle="Impact × likelihood heatmap" icon={Grid3x3} accent="amber" className="h-full">
      {risks.isLoading ? (
        <LoadingSkeleton className="mx-auto h-48 w-full" />
      ) : risks.isError ? (
        <ErrorState compact title="Unable to load risks" onRetry={() => risks.refetch()} />
      ) : !matrix.hasData ? (
        <EmptyState
          icon={Grid3x3}
          title="Risk matrix unavailable"
          description="Backend has not returned impact/likelihood fields yet."
        />
      ) : (
        <div>
          <div className="flex">
            {/* y-axis label */}
            <div className="flex w-5 items-center justify-center">
              <span className="-rotate-90 whitespace-nowrap text-[10px] font-bold uppercase tracking-wide text-cv-mist">
                Likelihood
              </span>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-5 gap-1.5">
                {matrix.cells.map((row, r) =>
                  row.map((count, c) => {
                    const impact = c + 1;
                    const likelihood = 5 - r;
                    return (
                      <div
                        key={`${r}-${c}`}
                        className="flex aspect-square items-center justify-center rounded-lg text-[13px] font-bold text-cv-ink ring-1 ring-white/50"
                        style={{ background: cellColor(impact, likelihood) }}
                        title={`Impact ${impact} × Likelihood ${likelihood}: ${count}`}
                      >
                        {count > 0 ? count : ""}
                      </div>
                    );
                  })
                )}
              </div>
              <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-wide text-cv-mist">Impact →</p>
            </div>
          </div>
          <p className="mt-3 text-center text-[11px] text-cv-slate">
            {matrix.total} risk{matrix.total === 1 ? "" : "s"} plotted from real impact &amp; likelihood
          </p>
        </div>
      )}
    </SectionCard>
  );
}
