"use client";

import { Workflow } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import type { AutopilotData } from "@/lib/hooks/useAutopilot";

/**
 * Suggestion → intent → approval → override pipeline, each stage from its own
 * real summary endpoint. Shows where work is queued and where it stalls.
 */
export function AutopilotPipeline({ data }: { data: AutopilotData }) {
  const { candidates, intents, approvals, overrides } = data;
  const loading = candidates.isLoading || intents.isLoading || approvals.isLoading || overrides.isLoading;
  const errored = candidates.isError && intents.isError && approvals.isError && overrides.isError;

  const stages = [
    {
      label: "Candidate actions",
      count: candidates.data?.total_candidate_actions ?? null,
      note: "deterministic suggestions for operators"
    },
    {
      label: "Execution intents",
      count: intents.data?.total_intents ?? null,
      note:
        intents.data && intents.data.blocked_count > 0
          ? `${intents.data.blocked_count} blocked by guardrails`
          : "dry-run planning artifacts"
    },
    {
      label: "Execution approvals",
      count: approvals.data?.total_approvals ?? null,
      note:
        approvals.data && approvals.data.ready_for_runner_count > 0
          ? `${approvals.data.ready_for_runner_count} ready for runner`
          : "human authorization records"
    },
    {
      label: "Override requests",
      count: overrides.data?.total_requests ?? null,
      note:
        overrides.data && overrides.data.pending_approval_over_24h > 0
          ? `${overrides.data.pending_approval_over_24h} pending >24h — escalate`
          : "policy overrides with approval flow"
    }
  ];

  return (
    <SectionCard
      title="Execution Pipeline"
      subtitle="From suggestion to approved execution"
      icon={Workflow}
      accent="purple"
      className="h-full"
    >
      {loading ? (
        <SkeletonRows rows={4} />
      ) : errored ? (
        <ErrorState
          title="Unable to load pipeline"
          onRetry={() => {
            candidates.refetch();
            intents.refetch();
            approvals.refetch();
            overrides.refetch();
          }}
        />
      ) : (
        <ol className="space-y-2.5">
          {stages.map((stage, i) => (
            <li key={stage.label} className="flex items-center gap-3 rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cv-brand-soft text-sm font-extrabold text-cv-blue">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-cv-ink">{stage.label}</p>
                <p className="text-[11px] text-cv-slate">{stage.note}</p>
              </div>
              <span className="text-xl font-extrabold text-cv-ink">{stage.count ?? "—"}</span>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  );
}
