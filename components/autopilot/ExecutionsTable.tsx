"use client";

import { useState } from "react";
import { Loader2, PlayCircle, Undo2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { ApiError } from "@/lib/api/client";
import { useAutopilotExecutions, useReverseExecution } from "@/lib/hooks/useAutopilot";

function prettify(v: string) {
  return v.replaceAll("_", " ");
}

const smallBtn =
  "cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1.5 text-[11px] font-semibold text-cv-slate ring-1 ring-white/70 transition hover:bg-white hover:text-cv-ink disabled:opacity-50";

/**
 * Real executed actions — GET /api/v1/ai-governance/autopilot/executions.
 * Every row is a genuine, audited side effect (e.g. a created follow-up task)
 * and stays reversible until its reversal deadline (POST …/{id}/reverse).
 */
export function ExecutionsTable() {
  const executions = useAutopilotExecutions();
  const reverse = useReverseExecution();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const rows = (executions.data ?? [])
    .slice()
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

  const run = async (id: string, fn: () => Promise<unknown>) => {
    setActionError(null);
    setBusyId(id);
    try {
      await fn();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Request failed — the backend may be unavailable.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SectionCard
      title="Executions"
      subtitle="Real, audited, reversible side effects performed by autopilot"
      icon={PlayCircle}
      accent="blue"
    >
      {executions.isLoading ? (
        <SkeletonRows rows={3} />
      ) : executions.isError ? (
        <ErrorState compact title="Unable to load executions" onRetry={() => executions.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          compact
          icon={PlayCircle}
          title="No executions yet"
          description="Autopilot only executes low-risk, automation-allowed actions after the org opts in and the policy permits it. Everything else stays a plan until a runner picks it up."
        />
      ) : (
        <ul className="space-y-2.5">
          {rows.map((ex) => {
            const reversed = Boolean(ex.reversed_at);
            const deadline = ex.reversal_deadline_at ? new Date(ex.reversal_deadline_at + "Z") : null;
            const withinWindow = deadline ? deadline.getTime() > Date.now() : false;
            return (
              <li
                key={ex.id}
                className="flex flex-col gap-2 rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-semibold text-cv-ink">{prettify(ex.action_key)}</p>
                    <StatusBadge
                      label={prettify(ex.execution_status)}
                      tone={reversed ? "neutral" : ex.execution_status === "executed" ? "good" : "info"}
                    />
                    <StatusBadge label={`${ex.risk_tier} risk`} tone={ex.risk_tier === "low" ? "teal" : "warn"} />
                  </div>
                  <p className="mt-0.5 text-[11px] text-cv-slate">
                    {ex.created_at ? new Date(ex.created_at + "Z").toLocaleString() : "—"}
                    {reversed
                      ? ` · reversed${ex.reversal_reason ? `: ${ex.reversal_reason}` : ""}`
                      : deadline
                        ? ` · reversible until ${deadline.toLocaleString()}`
                        : ""}
                  </p>
                </div>
                {!reversed && withinWindow ? (
                  <button
                    type="button"
                    className={smallBtn}
                    disabled={busyId === ex.id}
                    onClick={() => run(ex.id, () => reverse.mutateAsync({ executionId: ex.id }))}
                    data-testid={`reverse-${ex.id}`}
                  >
                    {busyId === ex.id && reverse.isPending ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Undo2 size={12} />
                    )}
                    Reverse
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {actionError ? (
        <p role="alert" className="mt-3 rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">
          {actionError}
        </p>
      ) : null}
    </SectionCard>
  );
}
