"use client";

import { useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Plus, FileWarning, Loader2, CircleCheckBig, XCircle, ShieldQuestion } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { EntitlementBanner } from "@/components/common/EntitlementBanner";
import { ApiError } from "@/lib/api/client";
import { useHasPermission } from "@/lib/hooks/usePermissions";
import { useCurrentUser } from "@/lib/hooks/usePolicies";
import {
  usePolicyExceptions,
  useExceptionUsers,
  useRejectPolicyException
} from "@/lib/hooks/usePolicyExceptions";
import type { PolicyException } from "@/lib/api/policy-exceptions";
import type { OrgUser } from "@/lib/api/users";
import { RequestExceptionModal } from "@/components/policy-exceptions/RequestExceptionModal";
import { ApproveExceptionModal } from "@/components/policy-exceptions/ApproveExceptionModal";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

type Tone = "good" | "warn" | "bad" | "info" | "neutral" | "purple" | "teal";

const STATUS_TONE: Record<string, Tone> = {
  pending: "warn",
  approved: "good",
  rejected: "bad",
  expired: "neutral",
  withdrawn: "neutral"
};

function statusTone(status: string): Tone {
  return STATUS_TONE[status] ?? "neutral";
}

function shortId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

function userLabel(userId: string | null | undefined, currentUserId: string | null, byId: Map<string, OrgUser>): string {
  if (!userId) return "—";
  const isYou = currentUserId != null && userId === currentUserId;
  const user = byId.get(userId);
  const name = user?.full_name || user?.email || shortId(userId);
  return isYou ? `${name} (you)` : name;
}

function fmtDate(value: string | null): string | null {
  if (!value) return null;
  // expiry_date is "YYYY-MM-DD"; decision timestamps are ISO — slice to the date.
  return value.slice(0, 10);
}

function ExceptionRow({
  exception,
  currentUserId,
  byId,
  canWrite,
  onApprove
}: {
  exception: PolicyException;
  currentUserId: string | null;
  byId: Map<string, OrgUser>;
  canWrite: boolean;
  onApprove: (exception: PolicyException) => void;
}) {
  const reject = useRejectPolicyException();
  const rejectErr = reject.error instanceof ApiError ? reject.error : null;

  const isPending = exception.status === "pending";
  const isRequester = currentUserId != null && exception.requested_by === currentUserId;
  // Four-eyes: the requester may never approve/reject their own exception.
  const canReview = canWrite && isPending && !isRequester;

  const meta: string[] = [];
  if (exception.policy_current_version) meta.push(`policy v${exception.policy_current_version}`);
  if (exception.policy_is_archived) meta.push("policy archived");
  const expiry = fmtDate(exception.expiry_date);
  if (expiry) meta.push(`expires ${expiry}`);

  return (
    <li className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusBadge label={exception.status} tone={statusTone(exception.status)} />
            <span className="truncate text-[11px] text-cv-mist">exception {shortId(exception.id)}</span>
          </div>
          <p className="mt-1.5 text-[13px] font-semibold leading-snug text-cv-ink">
            {exception.reason || "No reason provided"}
          </p>
          {exception.compensating_measure_description ? (
            <p className="mt-0.5 text-[11px] leading-snug text-cv-slate">
              Compensating measure: {exception.compensating_measure_description}
            </p>
          ) : null}

          {/* Approval chain */}
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-cv-slate">
            <span>Requested by {userLabel(exception.requested_by, currentUserId, byId)}</span>
            {exception.approved_by ? (
              <span className="text-emerald-600">
                Approved by {userLabel(exception.approved_by, currentUserId, byId)}
                {fmtDate(exception.approved_at) ? ` on ${fmtDate(exception.approved_at)}` : ""}
              </span>
            ) : null}
            {exception.rejected_by ? (
              <span className="text-rose-600">
                Rejected by {userLabel(exception.rejected_by, currentUserId, byId)}
                {fmtDate(exception.rejected_at) ? ` on ${fmtDate(exception.rejected_at)}` : ""}
              </span>
            ) : null}
          </div>

          {meta.length ? <p className="mt-1 text-[11px] text-cv-mist">{meta.join(" · ")}</p> : null}

          {/* Four-eyes note for the requester on their own pending exception */}
          {isPending && isRequester ? (
            <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-amber-500/10 px-2.5 py-1.5 text-[11px] leading-snug text-amber-700 ring-1 ring-amber-400/25">
              <ShieldQuestion size={13} className="mt-0.5 shrink-0" />
              You requested this exception — a different reviewer must approve it (four-eyes control).
            </p>
          ) : null}

          {rejectErr ? (
            <div className="mt-2">
              <EntitlementBanner error={rejectErr} />
            </div>
          ) : null}
        </div>

        {canReview ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => onApprove(exception)}
              className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-button transition hover:-translate-y-0.5"
            >
              <CircleCheckBig size={13} />
              Approve
            </button>
            <button
              type="button"
              onClick={() => reject.mutate({ exceptionId: exception.id })}
              disabled={reject.isPending}
              className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[12px] font-semibold text-rose-600 ring-1 ring-rose-400/25 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {reject.isPending ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
              Reject
            </button>
          </div>
        ) : null}
      </div>
    </li>
  );
}

export default function PolicyExceptionsPage() {
  const exceptions = usePolicyExceptions();
  const users = useExceptionUsers();
  const currentUser = useCurrentUser();
  const canWrite = useHasPermission("compliance_policies:write");

  const [createOpen, setCreateOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<PolicyException | null>(null);

  const byId = useMemo(() => {
    const map = new Map<string, OrgUser>();
    for (const u of users.data ?? []) map.set(u.id, u);
    return map;
  }, [users.data]);

  const list = useMemo(() => exceptions.data ?? [], [exceptions.data]);
  const currentUserId = currentUser.data?.id ?? null;

  return (
    <div className="space-y-7">
      {/* Header */}
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
                <FileWarning size={15} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Policy Governance</span>
            </div>
            <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">
              Policy Exceptions
            </h1>
            <p className="max-w-2xl text-[15px] text-cv-slate">
              Request, review, and track time-boxed exceptions to policies. Every exception is subject to a four-eyes
              control — the requester can never approve their own request.
            </p>
          </div>

          {canWrite ? (
            <div className="flex shrink-0 items-center gap-2.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-5 py-2.5 text-[13px] font-semibold text-white shadow-tile transition hover:opacity-90"
              >
                <Plus size={15} strokeWidth={2.6} />
                Request exception
              </button>
            </div>
          ) : null}
        </div>
      </motion.div>

      {/* List */}
      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <SectionCard
          title="Exceptions"
          subtitle="Pending exceptions await review by someone other than the requester"
          icon={FileWarning}
          accent="amber"
          action={
            exceptions.isSuccess ? (
              <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
                {list.length} total
              </span>
            ) : null
          }
        >
          {exceptions.isLoading ? (
            <SkeletonRows rows={5} />
          ) : exceptions.isError ? (
            <ErrorState title="Unable to load exceptions" onRetry={() => exceptions.refetch()} />
          ) : list.length === 0 ? (
            <EmptyState
              icon={FileWarning}
              title="No policy exceptions"
              description={
                canWrite
                  ? "Request an exception when a policy requirement can't be met and needs a documented, time-boxed carve-out."
                  : "There are no policy exceptions to review yet."
              }
            />
          ) : (
            <ul className="space-y-2.5">
              {list.map((ex) => (
                <ExceptionRow
                  key={ex.id}
                  exception={ex}
                  currentUserId={currentUserId}
                  byId={byId}
                  canWrite={canWrite}
                  onApprove={setApproveTarget}
                />
              ))}
            </ul>
          )}
        </SectionCard>
      </motion.div>

      <RequestExceptionModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <ApproveExceptionModal exception={approveTarget} onClose={() => setApproveTarget(null)} />
    </div>
  );
}
