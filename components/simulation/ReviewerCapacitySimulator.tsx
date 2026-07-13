"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Loader2, TriangleAlert, ArrowRight, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { getReviewerWorkload, simulateReviewerCapacityPolicy, type ReviewerCapacitySimulationResponse } from "@/lib/api/simulation";

/**
 * What this actually is: the backend recomputes every active reviewer's
 * deterministic workload score under a hypothetical reviewer-capacity policy
 * (max active/overdue assignments, preferred review type & coverage level)
 * and compares it to their current score. Nothing is persisted — no policy is
 * saved, no assignment changes. It answers "if we set this capacity policy,
 * whose workload score would change and by how much" — nothing broader.
 */
export function ReviewerCapacitySimulator() {
  const workload = useQuery({ queryKey: ["reviewer-workload"], queryFn: getReviewerWorkload });

  const roleOptions = useMemo(() => {
    const roles = new Set((workload.data ?? []).map((w) => w.role_name));
    return Array.from(roles).sort();
  }, [workload.data]);

  const [roleName, setRoleName] = useState<string>("");
  const [maxActive, setMaxActive] = useState(5);
  const [maxOverdue, setMaxOverdue] = useState(1);
  const [reviewType, setReviewType] = useState("");
  const [targetCoverageLevel, setTargetCoverageLevel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReviewerCapacitySimulationResponse | null>(null);

  async function runSimulation() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const response = await simulateReviewerCapacityPolicy({
        role_name: roleName || null,
        max_active_assignments: maxActive,
        max_overdue_assignments: maxOverdue,
        review_type: reviewType.trim() || null,
        target_coverage_level: targetCoverageLevel.trim() || null
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SectionCard
      title="Reviewer-Capacity Policy Simulation"
      subtitle="Real backend simulator — deterministic workload scoring, non-persisting"
      icon={Users}
      accent="teal"
    >
      <div className="space-y-4">
        <p className="text-[13px] leading-relaxed text-cv-slate">
          This runs the backend&apos;s actual reviewer-workload scoring formula against every currently active
          reviewer, using a hypothetical capacity policy instead of any saved one. It shows exactly whose workload
          score would rise or fall and why. It does not save the policy, reassign work, or touch real workload
          snapshots.
        </p>

        {workload.isLoading ? (
          <SkeletonRows rows={2} />
        ) : workload.isError ? (
          <ErrorState compact title="Could not load reviewer workload" onRetry={() => workload.refetch()} />
        ) : (
          <p className="text-[11px] text-cv-mist">
            {workload.data?.length ?? 0} active reviewer{(workload.data?.length ?? 0) === 1 ? "" : "s"} in this
            organization will be scored under the policy below.
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wide text-cv-slate">Reviewer role (optional)</label>
            <select
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              className="cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none"
            >
              <option value="">(all roles)</option>
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wide text-cv-slate">Review type (optional)</label>
            <input
              value={reviewType}
              onChange={(e) => setReviewType(e.target.value)}
              placeholder="e.g. periodic_review"
              className="cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wide text-cv-slate">Max active assignments</label>
            <input
              type="number"
              min={0}
              value={maxActive}
              onChange={(e) => setMaxActive(Number(e.target.value))}
              className="cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wide text-cv-slate">Max overdue assignments</label>
            <input
              type="number"
              min={0}
              value={maxOverdue}
              onChange={(e) => setMaxOverdue(Number(e.target.value))}
              className="cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-[11px] font-bold uppercase tracking-wide text-cv-slate">Target coverage level (optional)</label>
            <input
              value={targetCoverageLevel}
              onChange={(e) => setTargetCoverageLevel(e.target.value)}
              placeholder="e.g. full, sample"
              className="cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={runSimulation}
          disabled={busy}
          className="cv-ring-focus inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-cv-brand px-4 py-2.5 text-[13px] font-bold text-white shadow-tile transition hover:opacity-90 disabled:opacity-60"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
          Run capacity simulation
        </button>

        {error ? (
          <p className="flex items-start gap-1.5 text-[12px] font-medium text-rose-600">
            <TriangleAlert size={13} className="mt-0.5 shrink-0" />
            {error}
          </p>
        ) : null}

        {result ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <SummaryStat label="Avg workload (current)" value={result.current_summary.average_workload_score.toFixed(0)} />
              <SummaryStat label="Avg workload (simulated)" value={result.simulated_summary.average_workload_score.toFixed(0)} />
              <SummaryStat label="Overloaded (current)" value={String(result.current_summary.overloaded_reviewers)} />
              <SummaryStat label="Overloaded (simulated)" value={String(result.simulated_summary.overloaded_reviewers)} />
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-cv-slate">Per-reviewer score change</p>
              {result.reviewer_comparisons.map((c) => (
                <div key={c.user_id} className="flex items-center justify-between rounded-lg bg-white/50 px-3 py-2 ring-1 ring-white/60">
                  <div>
                    <p className="text-[12px] font-semibold text-cv-ink">{c.role_name}</p>
                    <p className="font-mono text-[10px] text-cv-mist">{c.user_id.slice(0, 8)}…</p>
                  </div>
                  <div className="flex items-center gap-2 text-[12px]">
                    <span className="font-semibold text-cv-slate">{c.current_workload_score}</span>
                    <ArrowRight size={12} className="text-cv-mist" />
                    <span className="font-semibold text-cv-ink">{c.simulated_workload_score}</span>
                    <DeltaBadge delta={c.delta} />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] italic leading-relaxed text-cv-mist">{result.caveat}</p>
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/50 px-3 py-2.5 text-center ring-1 ring-white/60">
      <p className="text-[17px] font-extrabold text-cv-ink">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-cv-slate">{label}</p>
    </div>
  );
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-500/10 px-1.5 py-0.5 text-[10px] font-bold text-cv-slate">
        <Minus size={10} /> 0
      </span>
    );
  }
  const positive = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
        positive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
      }`}
    >
      {positive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
      {Math.abs(delta)}
    </span>
  );
}
