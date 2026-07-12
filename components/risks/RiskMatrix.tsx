"use client";

import { useMemo, useState } from "react";
import { Grid3x3, SquarePen } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { RiskFormModal } from "@/components/risks/RiskFormModal";
import { cn } from "@/lib/utils/cn";
import type { Risk } from "@/lib/api/risks";
import type { RisksData } from "@/lib/hooks/useRisks";

/** Cell color scales with likelihood × impact zone, intensity with count. */
function cellClasses(likelihood: number, impact: number, count: number): string {
  const zone = likelihood * impact;
  if (count === 0) return "bg-slate-400/8 text-cv-mist";
  if (zone >= 15) return "bg-rose-500/75 text-white";
  if (zone >= 8) return "bg-amber-400/80 text-white";
  return "bg-emerald-500/70 text-white";
}

/**
 * 5×5 likelihood/impact matrix from GET /api/v1/risks/heatmap.
 * Cells with risks are clickable: selecting one lists its risks, and picking a
 * risk opens the edit form. Saving invalidates the heatmap query, so the risk
 * moves cells live when likelihood/impact change.
 */
export function RiskMatrix({ data }: { data: RisksData }) {
  const { heatmap, risks } = data;
  const cells = heatmap.data?.matrix ?? [];
  const total = cells.reduce((s, c) => s + c.count, 0);
  const byKey = useMemo(() => new Map(cells.map((c) => [`${c.likelihood}-${c.impact}`, c])), [cells]);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editRisk, setEditRisk] = useState<Risk | null>(null);
  const [missingRiskTitle, setMissingRiskTitle] = useState<string | null>(null);

  const selectedCell = selectedKey ? byKey.get(selectedKey) : undefined;

  const openEditor = (riskId: string, title: string) => {
    // The heatmap only carries {id, title}; the full record comes from the register query.
    const full = (risks.data ?? []).find((r) => r.id === riskId);
    if (full) {
      setMissingRiskTitle(null);
      setEditRisk(full);
    } else {
      setMissingRiskTitle(title);
    }
  };

  return (
    <SectionCard
      title="Risk Matrix"
      subtitle="Likelihood × impact — click a cell to edit its risks"
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
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex flex-col justify-between py-1 text-[10px] font-semibold text-cv-mist">
              <span className="-rotate-90">High</span>
              <span className="-rotate-90">Low</span>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-5 gap-1.5">
                {[5, 4, 3, 2, 1].map((likelihood) =>
                  [1, 2, 3, 4, 5].map((impact) => {
                    const key = `${likelihood}-${impact}`;
                    const cell = byKey.get(key);
                    const count = cell?.count ?? 0;
                    const names = cell?.risks.map((r) => r.title).join(", ");
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={count === 0}
                        onClick={() => setSelectedKey((k) => (k === key ? null : key))}
                        title={names || `Likelihood ${likelihood}, impact ${impact}`}
                        aria-label={`Likelihood ${likelihood}, impact ${impact}: ${count} risk${count === 1 ? "" : "s"}`}
                        aria-pressed={selectedKey === key}
                        className={cn(
                          "cv-ring-focus flex aspect-square items-center justify-center rounded-lg text-sm font-extrabold transition",
                          cellClasses(likelihood, impact, count),
                          count > 0 && "cursor-pointer hover:scale-[1.06]",
                          selectedKey === key && count > 0 && "ring-2 ring-cv-ink/60 ring-offset-1 ring-offset-white/40"
                        )}
                      >
                        {count > 0 ? count : ""}
                      </button>
                    );
                  })
                )}
              </div>
              <p className="mt-1.5 text-center text-[10px] font-semibold text-cv-mist">Impact →</p>
            </div>
          </div>

          {selectedKey ? (
            <div className="rounded-2xl bg-white/55 p-3 ring-1 ring-white/70">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate">
                {`L${selectedKey.split("-")[0]} × I${selectedKey.split("-")[1]}`} — {selectedCell?.count ?? 0} risk
                {(selectedCell?.count ?? 0) === 1 ? "" : "s"}
              </p>
              {!selectedCell || selectedCell.risks.length === 0 ? (
                <p className="mt-1.5 text-xs text-cv-mist">No risks remain in this cell.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {selectedCell.risks.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => openEditor(r.id, r.title)}
                        className="cv-ring-focus flex w-full items-center justify-between gap-2 rounded-xl bg-white/60 px-3 py-2 text-left ring-1 ring-white/70 transition hover:bg-white/90"
                      >
                        <span className="min-w-0 truncate text-xs font-semibold text-cv-ink">{r.title}</span>
                        <SquarePen size={13} className="shrink-0 text-cv-slate" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {missingRiskTitle ? (
                <p className="mt-2 text-[11px] text-rose-600">
                  “{missingRiskTitle}” is not in the loaded register page, so it cannot be edited from here.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      <RiskFormModal open={editRisk !== null} onClose={() => setEditRisk(null)} risk={editRisk} />
    </SectionCard>
  );
}
