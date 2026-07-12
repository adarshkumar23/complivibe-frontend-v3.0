"use client";

import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { cn } from "@/lib/utils/cn";
import { ApiError } from "@/lib/api/client";
import { useGovernanceSettings, useUpdateGovernanceSettings, type AutopilotData } from "@/lib/hooks/useAutopilot";

/**
 * Org-level auto-execution opt-in — GET/PATCH /api/v1/organizations/me/governance-settings.
 * Off by default; even when on, only low-risk automation-allowed actions under a
 * permitting policy ever execute, and each execution stays reversible.
 */
function AutoExecuteOptIn() {
  const settings = useGovernanceSettings();
  const update = useUpdateGovernanceSettings();
  const [error, setError] = useState<string | null>(null);

  if (settings.isLoading) return <SkeletonRows rows={1} />;
  if (settings.isError || !settings.data) {
    return <p className="text-[11px] text-cv-mist">Governance settings unavailable — opt-in state unknown.</p>;
  }
  const enabled = Boolean(settings.data.autopilot_auto_execute_enabled);

  const toggle = async () => {
    setError(null);
    try {
      await update.mutateAsync({ autopilot_auto_execute_enabled: !enabled });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Request failed — the backend may be unavailable.");
    }
  };

  return (
    <div className="rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-cv-ink">Auto-execution opt-in</p>
          <p className="text-[11px] text-cv-slate">
            {enabled ? "Org has opted in — eligible low-risk actions may execute" : "Off — autopilot plans but never executes"}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Auto-execution opt-in"
          disabled={update.isPending}
          onClick={toggle}
          data-testid="auto-execute-toggle"
          className={cn(
            "cv-ring-focus relative h-5 w-9 shrink-0 rounded-full transition disabled:opacity-60",
            enabled ? "bg-amber-500" : "bg-slate-300/70"
          )}
        >
          {update.isPending ? (
            <Loader2 size={11} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-white" />
          ) : (
            <span
              className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all",
                enabled ? "left-[18px]" : "left-0.5"
              )}
            />
          )}
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 ring-1 ring-rose-400/25">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Resolved permission surface from GET /api/v1/ai-governance/autopilot/summary. */
export function AutopilotGuardrails({ data }: { data: AutopilotData }) {
  const { summary } = data;
  const s = summary.data;

  const rows = s
    ? [
        { label: "External effects", allowed: s.external_effects_allowed },
        { label: "Task creation", allowed: s.task_creation_allowed },
        { label: "Review creation", allowed: s.review_creation_allowed },
        { label: "Source record mutation", allowed: s.source_record_mutation_allowed }
      ]
    : [];

  return (
    <SectionCard
      title="Autopilot Guardrails"
      subtitle={s ? `Policy source: ${s.resolved_source.replaceAll("_", " ")}` : "Resolved permission surface"}
      icon={ShieldCheck}
      accent="teal"
    >
      {summary.isLoading ? (
        <SkeletonRows rows={4} />
      ) : summary.isError ? (
        <ErrorState compact title="Unable to load guardrails" onRetry={() => summary.refetch()} />
      ) : (
        <ul className="space-y-2.5">
          <li>
            <AutoExecuteOptIn />
          </li>
          {rows.map((r) => (
            <li key={r.label} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <span className="text-[13px] font-semibold text-cv-ink">{r.label}</span>
              <StatusBadge label={r.allowed ? "Allowed" : "Blocked"} tone={r.allowed ? "warn" : "good"} />
            </li>
          ))}
          {s ? (
            <p className="pt-1 text-[10px] leading-relaxed text-cv-mist">
              Blocked is the safe state: autopilot plans actions but cannot execute them without explicit policy grants
              and human approval.
            </p>
          ) : null}
        </ul>
      )}
    </SectionCard>
  );
}
