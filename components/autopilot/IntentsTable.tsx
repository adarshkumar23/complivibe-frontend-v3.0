"use client";

import { useState } from "react";
import { Archive, ClipboardList, Loader2, Plus, Stamp } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { PlanActionModal } from "@/components/autopilot/PlanActionModal";
import { ApiError } from "@/lib/api/client";
import type { ExecutionIntent } from "@/lib/api/autopilot";
import {
  useArchiveIntent,
  useExecutionApprovals,
  useExecutionIntents,
  useRequestApproval
} from "@/lib/hooks/useAutopilot";

function prettify(v: string) {
  return v.replaceAll("_", " ");
}

function statusTone(status: string) {
  switch (status) {
    case "planned":
      return "good" as const;
    case "approval_required":
      return "warn" as const;
    case "blocked":
      return "bad" as const;
    default:
      return "neutral" as const;
  }
}

const smallBtn =
  "cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1.5 text-[11px] font-semibold text-cv-slate ring-1 ring-white/70 transition hover:bg-white hover:text-cv-ink disabled:opacity-50";

/**
 * Execution intents stage — GET /api/v1/ai-governance/autopilot/execution-intents.
 * Row actions: request approval (POST …/{id}/approval-requests) and archive.
 * Approval state per intent is joined client-side from the approvals list.
 */
export function IntentsTable() {
  const intents = useExecutionIntents();
  const approvals = useExecutionApprovals();
  const requestApproval = useRequestApproval();
  const archive = useArchiveIntent();
  const [planOpen, setPlanOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const visible = (intents.data ?? []).filter((i) => i.intent_status !== "archived" && !i.archived_at);

  const latestApprovalStatus = (intent: ExecutionIntent): string | null => {
    const rows = (approvals.data ?? [])
      .filter((a) => a.execution_intent_id === intent.id)
      .sort((a, b) => (b.requested_at ?? "").localeCompare(a.requested_at ?? ""));
    return rows[0]?.approval_status ?? null;
  };

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
      title="Execution Intents"
      subtitle="Policy-evaluated plans awaiting authorization or runner handoff"
      icon={ClipboardList}
      accent="purple"
      action={
        <button type="button" onClick={() => setPlanOpen(true)} className={smallBtn} data-testid="plan-action">
          <Plus size={13} strokeWidth={2.6} />
          Plan action
        </button>
      }
    >
      {intents.isLoading ? (
        <SkeletonRows rows={3} />
      ) : intents.isError ? (
        <ErrorState compact title="Unable to load execution intents" onRetry={() => intents.refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState
          compact
          icon={ClipboardList}
          title="No execution intents yet"
          description="Plan a candidate action from the backend catalog to feed the pipeline — the resolved policy decides whether it is planned, needs approval, or is blocked."
        />
      ) : (
        <ul className="space-y-2.5">
          {visible.map((intent) => {
            const action = intent.plan_payload_json?.candidate_action;
            const approvalStatus = latestApprovalStatus(intent);
            const canRequest =
              intent.intent_status === "approval_required" && approvalStatus !== "requested" && approvalStatus !== "approved";
            return (
              <li
                key={intent.id}
                className="flex flex-col gap-2 rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-semibold text-cv-ink">
                      {String(action?.title ?? action?.action_key ?? prettify(intent.source_type))}
                    </p>
                    <StatusBadge label={prettify(intent.intent_status)} tone={statusTone(intent.intent_status)} />
                    {action?.risk_tier ? (
                      <StatusBadge
                        label={`${action.risk_tier} risk`}
                        tone={action.risk_tier === "low" ? "teal" : action.risk_tier === "high" ? "bad" : "warn"}
                      />
                    ) : null}
                    {approvalStatus ? (
                      <StatusBadge
                        label={`approval ${approvalStatus}`}
                        tone={approvalStatus === "approved" ? "good" : approvalStatus === "rejected" ? "bad" : "info"}
                      />
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-[11px] text-cv-slate">
                    {action?.action_key ? `${prettify(String(action.action_key))} · ` : ""}
                    band: {String(action?.priority_band ?? "—")}
                    {intent.blocked_reasons_json?.length
                      ? ` · blocked: ${intent.blocked_reasons_json.map(prettify).join(", ")}`
                      : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {canRequest ? (
                    <button
                      type="button"
                      className={smallBtn}
                      disabled={busyId === intent.id && requestApproval.isPending}
                      onClick={() => run(intent.id, () => requestApproval.mutateAsync({ intentId: intent.id }))}
                    >
                      {busyId === intent.id && requestApproval.isPending ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Stamp size={12} />
                      )}
                      Request approval
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={smallBtn}
                    disabled={busyId === intent.id && archive.isPending}
                    onClick={() => run(intent.id, () => archive.mutateAsync({ intentId: intent.id }))}
                  >
                    {busyId === intent.id && archive.isPending ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Archive size={12} />
                    )}
                    Archive
                  </button>
                </div>
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

      <PlanActionModal open={planOpen} onClose={() => setPlanOpen(false)} />
    </SectionCard>
  );
}
