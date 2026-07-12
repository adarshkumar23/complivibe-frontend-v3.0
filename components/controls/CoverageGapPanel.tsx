"use client";

import { forwardRef, useMemo, useState } from "react";
import { Link2, ListChecks, Unlink } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useActiveFrameworks, useFrameworkCoverage } from "@/lib/hooks/useControls";
import type { ObligationPreset } from "@/components/controls/MapObligationModal";

function coverageTone(status: string): "good" | "warn" | "bad" | "neutral" {
  switch (status) {
    case "covered":
      return "good";
    case "partial":
      return "warn";
    case "uncovered":
      return "bad";
    default:
      return "neutral";
  }
}

/**
 * Per-framework obligation coverage (GET /api/v1/reports/framework-coverage-matrix)
 * with a "Map control" action on every uncovered obligation.
 */
export const CoverageGapPanel = forwardRef<HTMLDivElement, { onMap: (preset: ObligationPreset) => void }>(
  function CoverageGapPanel({ onMap }, ref) {
    const frameworks = useActiveFrameworks();
    const [frameworkId, setFrameworkId] = useState("");
    const [showCovered, setShowCovered] = useState(false);
    const coverage = useFrameworkCoverage(frameworkId || null);

    const rows = useMemo(() => {
      const all = (coverage.data?.sections ?? []).flatMap((s) => s.obligations);
      const sorted = [...all].sort((a, b) => {
        const rank = (st: string) => (st === "uncovered" ? 0 : st === "partial" ? 1 : 2);
        return rank(a.coverage_status) - rank(b.coverage_status) || a.reference.localeCompare(b.reference);
      });
      return showCovered ? sorted : sorted.filter((o) => o.coverage_status !== "covered");
    }, [coverage.data, showCovered]);

    const m = coverage.data;

    return (
      <div ref={ref}>
        <SectionCard
          title="Obligation Coverage Gaps"
          subtitle="Uncovered obligations per framework — map a control to close each gap"
          icon={Unlink}
          accent="amber"
          action={
            m ? (
              <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-400/25">
                {m.uncovered} of {m.total_obligations} uncovered
              </span>
            ) : null
          }
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                value={frameworkId}
                onChange={(e) => setFrameworkId(e.target.value)}
                className="cv-ring-focus flex-1 rounded-full bg-white/60 px-3.5 py-2 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none"
                disabled={frameworks.isLoading}
                aria-label="Framework"
              >
                <option value="">
                  {frameworks.isLoading
                    ? "Loading frameworks…"
                    : frameworks.isError
                      ? "Could not load frameworks"
                      : "Select an active framework…"}
                </option>
                {(frameworks.data ?? []).map((f) => (
                  <option key={f.framework_id} value={f.framework_id}>
                    {f.framework.name}
                    {f.active_obligation_count != null ? ` (${f.active_obligation_count} obligations)` : ""}
                  </option>
                ))}
              </select>
              <label className="flex shrink-0 cursor-pointer items-center gap-2 text-[12px] font-medium text-cv-slate">
                <input
                  type="checkbox"
                  checked={showCovered}
                  onChange={(e) => setShowCovered(e.target.checked)}
                  className="h-3.5 w-3.5 rounded accent-[#3B82F6]"
                />
                Show covered too
              </label>
            </div>

            {!frameworkId ? (
              <EmptyState
                compact
                icon={ListChecks}
                title="Pick a framework"
                description="Choose an active framework to list its obligations and their control coverage."
              />
            ) : coverage.isLoading ? (
              <SkeletonRows rows={5} />
            ) : coverage.isError ? (
              <ErrorState compact title="Unable to load coverage matrix" onRetry={() => coverage.refetch()} />
            ) : rows.length === 0 ? (
              <EmptyState
                compact
                icon={ListChecks}
                title={showCovered ? "No obligations found" : "No gaps in this framework"}
                description={
                  showCovered
                    ? "This framework has no obligations in the coverage matrix."
                    : "Every obligation in this framework already has at least one control mapped."
                }
              />
            ) : (
              <ul className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
                {rows.map((o) => (
                  <li
                    key={o.obligation_id}
                    className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold leading-snug text-cv-ink">
                          <span className="mr-1.5 text-amber-700">{o.reference}</span>
                          {o.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-cv-slate">
                          {o.controls_count} {o.controls_count === 1 ? "control" : "controls"} · {o.evidence_count}{" "}
                          evidence
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <StatusBadge label={o.coverage_status} tone={coverageTone(o.coverage_status)} />
                        <button
                          type="button"
                          onClick={() =>
                            onMap({
                              frameworkId,
                              obligationId: o.obligation_id,
                              reference: o.reference,
                              title: o.title
                            })
                          }
                          className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-3 py-1.5 text-[11px] font-bold text-white shadow-button transition hover:-translate-y-0.5"
                        >
                          <Link2 size={12} strokeWidth={2.6} />
                          Map control
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SectionCard>
      </div>
    );
  }
);
