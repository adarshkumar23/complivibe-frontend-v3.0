"use client";

import { motion, type Variants } from "framer-motion";
import { Stamp, ClipboardCheck, Inbox, FileSignature } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { ApprovalRowActions } from "@/components/approvals/ApprovalRowActions";
import { useApprovals, useReviewDecision, useEnvelopeDecision, useExecutionApprovalDecision } from "@/lib/hooks/useApprovals";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function ApprovalsPage() {
  const { executionApprovals, reviewQueue, pendingReviews, envelopes, summary } = useApprovals();
  const reviewDecide = useReviewDecision();
  const envelopeDecide = useEnvelopeDecision();
  const executionDecide = useExecutionApprovalDecision();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
              <Stamp size={15} />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Human-in-the-loop</span>
          </div>
          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">Approvals</h1>
          <p className="max-w-2xl text-[15px] text-cv-slate">
            The real approval queues: autopilot execution approvals, AI governance reviews, and approval envelopes.
            Policy approvals live on each policy&apos;s detail flow.
          </p>
        </div>
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <RegistryKpi
          label="Awaiting Approval"
          icon={Stamp}
          accent="amber"
          value={summary.data ? summary.data.approval_required_count : null}
          caption={summary.data ? `${summary.data.total_approvals} approval records total` : undefined}
          loading={summary.isLoading}
          unavailableHint="Approval summary unavailable"
        />
        <RegistryKpi
          label="Ready to Execute"
          icon={ClipboardCheck}
          accent="green"
          value={summary.data ? summary.data.ready_for_runner_count : null}
          loading={summary.isLoading}
          unavailableHint="Approval summary unavailable"
        />
        <RegistryKpi
          label="Reviews Queued"
          icon={Inbox}
          accent="purple"
          value={reviewQueue.isSuccess ? reviewQueue.data.length : null}
          caption={reviewQueue.isSuccess && reviewQueue.data.length === 0 ? "no governance reviews due" : undefined}
          loading={reviewQueue.isLoading}
          unavailableHint="Review queue unavailable"
        />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Execution Approvals" subtitle="Autopilot actions needing sign-off" icon={Stamp} accent="amber" className="h-full">
          {executionApprovals.isLoading ? (
            <SkeletonRows rows={4} />
          ) : executionApprovals.isError ? (
            <ErrorState compact title="Unable to load approvals" onRetry={() => executionApprovals.refetch()} />
          ) : (executionApprovals.data ?? []).length === 0 ? (
            <EmptyState compact icon={Stamp} title="No pending approvals" description="Autopilot execution requests will queue here for human sign-off." />
          ) : (
            <ul className="space-y-2.5">
              {(executionApprovals.data ?? []).map((a, i) => (
                <li key={a.id ?? i} data-testid={`exec-approval-${a.id}`} className="rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-[13px] font-semibold text-cv-ink">Intent {String(a.intent_id ?? a.id).slice(0, 8)}</p>
                    {a.status ? <StatusBadge label={String(a.status)} tone="warn" /> : null}
                  </div>
                  {a.id && (a.status === "pending" || a.status === "approval_required") ? (
                    <ApprovalRowActions
                      permission="ai_systems:write"
                      approveNeedsReason
                      onDecide={(decision, notes) => executionDecide.mutateAsync({ id: String(a.id), decision, notes })}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Approval Envelopes" subtitle="Signed governance approval records" icon={FileSignature} accent="teal" className="h-full">
          {envelopes.isLoading ? (
            <SkeletonRows rows={4} />
          ) : envelopes.isError ? (
            <ErrorState compact title="Unable to load envelopes" onRetry={() => envelopes.refetch()} />
          ) : (envelopes.data ?? []).length === 0 ? (
            <EmptyState compact icon={FileSignature} title="No envelopes" description="Approval envelopes record signed governance decisions." />
          ) : (
            <ul className="space-y-2.5">
              {(envelopes.data ?? []).map((e, i) => (
                <li key={e.id ?? i} data-testid={`envelope-${e.id}`} className="rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-[13px] font-semibold text-cv-ink">{String(e.entity_type ?? "envelope")}</p>
                    {e.status ? <StatusBadge label={String(e.status)} tone="info" /> : null}
                  </div>
                  {e.id && (e.status === "pending" || e.status === "awaiting_approval") ? (
                    <ApprovalRowActions
                      permission="ai_governance:approve"
                      onDecide={(decision, notes) => envelopeDecide.mutateAsync({ id: String(e.id), decision, notes })}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </motion.div>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show">
        <SectionCard title="Reviews Awaiting Sign-off" subtitle="AI governance reviews to approve or reject (four-eyes enforced)" icon={Inbox} accent="purple">
          {pendingReviews.isLoading ? (
            <SkeletonRows rows={3} />
          ) : pendingReviews.isError ? (
            <ErrorState compact title="Unable to load reviews" onRetry={() => pendingReviews.refetch()} />
          ) : (pendingReviews.data ?? []).length === 0 ? (
            <EmptyState compact icon={Inbox} title="No reviews awaiting sign-off" description="Pending AI governance reviews will appear here." />
          ) : (
            <ul className="space-y-2.5">
              {(pendingReviews.data ?? []).map((r, i) => (
                <li key={r.id ?? i} data-testid={`review-${r.id}`} className="rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-[13px] font-semibold text-cv-ink">
                      {String(r.review_type ?? "review").replaceAll("_", " ")}
                    </p>
                    {r.status ? <StatusBadge label={String(r.status)} tone="warn" /> : null}
                  </div>
                  <ApprovalRowActions
                    permission="ai_governance:approve"
                    onDecide={(decision, notes) => reviewDecide.mutateAsync({ id: String(r.id), decision, notes })}
                  />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </motion.div>
    </div>
  );
}
