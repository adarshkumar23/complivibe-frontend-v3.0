"use client";

import { useState } from "react";
import { Check, Loader2, Stamp, X } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { cn } from "@/lib/utils/cn";
import { ApiError } from "@/lib/api/client";
import { useApproveApproval, useExecutionApprovals, useExecutionIntents, useRejectApproval } from "@/lib/hooks/useAutopilot";

function prettify(v: string) {
  return v.replaceAll("_", " ");
}

function tone(status: string) {
  switch (status) {
    case "approved":
      return "good" as const;
    case "rejected":
      return "bad" as const;
    case "requested":
      return "warn" as const;
    default:
      return "neutral" as const;
  }
}

const smallBtn =
  "cv-ring-focus inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ring-1 transition disabled:opacity-50";

/**
 * Human authorization stage — GET /api/v1/ai-governance/autopilot/execution-approvals
 * with approve (optional reason) / reject (reason REQUIRED by backend schema).
 */
export function ApprovalsTable() {
  const approvals = useExecutionApprovals();
  const intents = useExecutionIntents();
  const approve = useApproveApproval();
  const reject = useRejectApproval();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const rows = (approvals.data ?? [])
    .slice()
    .sort((a, b) => (b.requested_at ?? "").localeCompare(a.requested_at ?? ""));

  const intentLabel = (intentId: string) => {
    const intent = (intents.data ?? []).find((i) => i.id === intentId);
    const action = intent?.plan_payload_json?.candidate_action;
    return String(action?.title ?? action?.action_key ?? `intent ${intentId.slice(0, 8)}…`);
  };

  const run = async (id: string, fn: () => Promise<unknown>) => {
    setActionError(null);
    setBusyId(id);
    try {
      await fn();
      setRejectingId(null);
      setRejectReason("");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Request failed — the backend may be unavailable.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SectionCard
      title="Execution Approvals"
      subtitle="Human authorization gate before any runner handoff"
      icon={Stamp}
      accent="amber"
    >
      {approvals.isLoading ? (
        <SkeletonRows rows={3} />
      ) : approvals.isError ? (
        <ErrorState compact title="Unable to load approvals" onRetry={() => approvals.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          compact
          icon={Stamp}
          title="No approval requests yet"
          description="When an intent requires approval, request it from the Execution Intents table — it will appear here for a human decision."
        />
      ) : (
        <ul className="space-y-2.5">
          {rows.map((a) => (
            <li key={a.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-semibold text-cv-ink">{intentLabel(a.execution_intent_id)}</p>
                    <StatusBadge label={prettify(a.approval_status)} tone={tone(a.approval_status)} />
                  </div>
                  <p className="mt-0.5 text-[11px] text-cv-slate">
                    requested {a.requested_at ? new Date(a.requested_at + "Z").toLocaleString() : "—"}
                    {a.decision_reason ? ` · decision: ${a.decision_reason}` : ""}
                    {a.approval_note ? ` · note: ${a.approval_note}` : ""}
                  </p>
                </div>
                {a.approval_status === "requested" ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      className={cn(smallBtn, "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 hover:bg-emerald-500/20")}
                      disabled={busyId === a.id}
                      onClick={() => run(a.id, () => approve.mutateAsync({ approvalId: a.id }))}
                      data-testid={`approve-${a.id}`}
                    >
                      {busyId === a.id && approve.isPending ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Check size={12} strokeWidth={2.6} />
                      )}
                      Approve
                    </button>
                    <button
                      type="button"
                      className={cn(smallBtn, "bg-rose-500/10 text-rose-600 ring-rose-400/25 hover:bg-rose-500/20")}
                      disabled={busyId === a.id}
                      onClick={() => {
                        setActionError(null);
                        setRejectingId(rejectingId === a.id ? null : a.id);
                        setRejectReason("");
                      }}
                    >
                      <X size={12} strokeWidth={2.6} />
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>

              {rejectingId === a.id ? (
                <form
                  className="mt-2.5 flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!rejectReason.trim()) return;
                    run(a.id, () => reject.mutateAsync({ approvalId: a.id, reason: rejectReason.trim() }));
                  }}
                >
                  <input
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    required
                    placeholder="Rejection reason (required by backend)"
                    aria-label="Rejection reason"
                    className="cv-ring-focus w-full rounded-xl bg-white/60 px-3 py-2 text-[12px] text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={busyId === a.id || !rejectReason.trim()}
                    className={cn(smallBtn, "shrink-0 bg-rose-500/10 text-rose-600 ring-rose-400/25 hover:bg-rose-500/20")}
                  >
                    {busyId === a.id && reject.isPending ? <Loader2 size={12} className="animate-spin" /> : null}
                    Confirm reject
                  </button>
                </form>
              ) : null}
            </li>
          ))}
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
