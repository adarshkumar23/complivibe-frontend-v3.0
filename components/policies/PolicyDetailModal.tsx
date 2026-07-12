"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileClock,
  Loader2,
  ScrollText,
  Send,
  ThumbsDown,
  ThumbsUp,
  Undo2
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { formatDate } from "@/lib/utils/format";
import {
  usePolicies,
  usePolicyDetail,
  usePolicyUsers,
  useCurrentUser,
  useSubmitForReview,
  useApproveRequest,
  useRejectRequest,
  useCancelRequest,
  useUpdatePolicy,
  useArchivePolicy,
  useCreatePolicyVersion
} from "@/lib/hooks/usePolicies";
import type { Policy, PolicyVersion } from "@/lib/api/policies";

const inputCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none";
const labelCls = "mb-1 block text-[11px] font-bold uppercase tracking-wide text-cv-slate";
const primaryBtn =
  "cv-ring-focus inline-flex items-center justify-center gap-1.5 rounded-xl bg-cv-brand px-4 py-2.5 text-[13px] font-bold text-white shadow-tile transition hover:opacity-90 disabled:opacity-60";
const subtleBtn =
  "cv-ring-focus inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/60 px-4 py-2.5 text-[13px] font-bold text-cv-ink ring-1 ring-white/70 transition hover:bg-white disabled:opacity-60";

function tidy(s: string) {
  return s.replaceAll("_", " ");
}

function policyStatusTone(status: string): "good" | "warn" | "bad" | "neutral" | "info" {
  switch (status) {
    case "approved":
      return "good";
    case "under_review":
      return "info";
    case "draft":
      return "warn";
    default:
      return "neutral";
  }
}

function versionStatusTone(status: string): "good" | "warn" | "bad" | "neutral" | "info" | "purple" {
  switch (status) {
    case "approved":
      return "good";
    case "submitted":
      return "info";
    case "draft":
      return "warn";
    case "rejected":
      return "bad";
    case "superseded":
      return "purple";
    default:
      return "neutral";
  }
}

function requestStatusTone(status: string): "good" | "warn" | "bad" | "neutral" | "info" {
  switch (status) {
    case "approved":
      return "good";
    case "pending":
      return "info";
    case "rejected":
      return "bad";
    case "cancelled":
      return "neutral";
    default:
      return "neutral";
  }
}

function versionContentText(v: PolicyVersion): string | null {
  const snap = v.content_snapshot_json;
  if (snap && !Array.isArray(snap) && typeof snap === "object" && typeof snap.content === "string") {
    return snap.content;
  }
  return null;
}

/**
 * Policy detail + full lifecycle actions, all against real backend endpoints:
 * - Send for review: submit version → create approval request → policy under_review
 * - Approve / Reject (assigned approver; the backend refuses self-approval)
 * - Cancel a pending request (with reason)
 * - New version (needed after a rejection), Deprecate, Archive
 * - Version history (GET …/versions) and approval history (GET …/approval-requests)
 */
export function PolicyDetailModal({
  policyId,
  onClose
}: {
  policyId: string | null;
  onClose: () => void;
}) {
  const { policies } = usePolicies();
  const detail = usePolicyDetail(policyId);
  const users = usePolicyUsers();
  const me = useCurrentUser();

  const submitForReview = useSubmitForReview();
  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();
  const cancelRequest = useCancelRequest();
  const updatePolicy = useUpdatePolicy();
  const archivePolicy = useArchivePolicy();
  const createVersion = useCreatePolicyVersion();

  // Always read the freshest copy from the react-query cache so status changes
  // appear in the open modal without a reload.
  const policy: Policy | null = useMemo(
    () => (policies.data ?? []).find((p) => p.id === policyId) ?? null,
    [policies.data, policyId]
  );

  const [approverUserId, setApproverUserId] = useState("");
  const [submitVersionId, setSubmitVersionId] = useState("");
  const [submitNotes, setSubmitNotes] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [archiveReason, setArchiveReason] = useState("");
  const [showNewVersion, setShowNewVersion] = useState(false);
  const [newVersionNumber, setNewVersionNumber] = useState("");
  const [newVersionContent, setNewVersionContent] = useState("");
  const [newVersionSummary, setNewVersionSummary] = useState("");
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!policyId) return;
    setApproverUserId("");
    setSubmitVersionId("");
    setSubmitNotes("");
    setReviewNotes("");
    setCancelReason("");
    setArchiveReason("");
    setShowNewVersion(false);
    setNewVersionNumber("");
    setNewVersionContent("");
    setNewVersionSummary("");
    setExpandedVersionId(null);
    setActionError(null);
  }, [policyId]);

  const versions = detail.versions.data ?? [];
  const approvals = detail.approvals.data ?? [];
  const userList = users.data ?? [];
  const activeUsers = userList.filter((u) => u.is_active);
  const myId = me.data?.id ?? null;

  const userName = (id: string | null | undefined) => {
    if (!id) return "—";
    const u = userList.find((x) => x.id === id);
    return u ? u.full_name || u.email : id.slice(0, 8);
  };

  // Versions the backend will accept for submit-for-approval (draft or rejected).
  const submittableVersions = versions.filter((v) => v.status === "draft" || v.status === "rejected");
  const pendingRequest = approvals.find((r) => r.status === "pending") ?? null;
  const canSendForReview =
    !pendingRequest && policy != null && (policy.status === "draft" || policy.status === "under_review");

  const errOpts = {
    onError: (err: Error) => setActionError(err.message || "The backend rejected this action.")
  };

  if (!policyId) return null;

  return (
    <Modal
      open={Boolean(policyId)}
      onClose={onClose}
      title={policy?.title ?? "Policy"}
      subtitle={policy ? `${tidy(policy.policy_type)} · owned by ${userName(policy.owner_user_id)}` : undefined}
      icon={ScrollText}
      accent="blue"
      widthClassName="max-w-2xl"
    >
      {policy == null ? (
        <SkeletonRows rows={4} />
      ) : (
        <div className="space-y-4" data-testid="policy-detail">
          {/* ── Meta ── */}
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={tidy(policy.status)} tone={policyStatusTone(policy.status)} className="text-[12px]" />
            {policy.version ? <StatusBadge label={`v${policy.version}`} tone="neutral" /> : null}
            {policy.violation_count ? <StatusBadge label={`${policy.violation_count} violations`} tone="bad" /> : null}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-xl bg-white/45 p-3 text-[12px] ring-1 ring-white/60 sm:grid-cols-3">
            <p className="text-cv-slate">
              Effective <span className="font-semibold text-cv-ink">{formatDate(policy.effective_date) ?? "—"}</span>
            </p>
            <p className="text-cv-slate">
              Review due <span className="font-semibold text-cv-ink">{formatDate(policy.review_due_date) ?? "—"}</span>
            </p>
            <p className="text-cv-slate">
              Approved by <span className="font-semibold text-cv-ink">{userName(policy.approved_by_user_id)}</span>
            </p>
            {policy.description ? (
              <p className="col-span-2 mt-1 text-cv-slate sm:col-span-3">{policy.description}</p>
            ) : null}
            {policy.archive_reason ? (
              <p className="col-span-2 mt-1 text-cv-slate sm:col-span-3">
                Archive reason: <span className="font-semibold text-cv-ink">{policy.archive_reason}</span>
              </p>
            ) : null}
          </div>

          {/* ── Pending approval request ── */}
          {pendingRequest ? (
            <div className="rounded-xl bg-blue-500/8 p-3.5 ring-1 ring-blue-500/15" data-testid="pending-request">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-bold text-cv-ink">Awaiting approval</p>
                <StatusBadge label="pending" tone="info" />
              </div>
              <p className="mt-1 text-[12px] text-cv-slate">
                {userName(pendingRequest.requested_by_user_id)} requested approval from{" "}
                <span className="font-semibold text-cv-ink">{userName(pendingRequest.approver_user_id)}</span>
                {" · "}
                {formatDate(pendingRequest.created_at) ?? pendingRequest.created_at}
                {pendingRequest.notes ? ` · “${pendingRequest.notes}”` : ""}
              </p>
              {myId === pendingRequest.requested_by_user_id ? (
                <p className="mt-1 text-[11px] text-cv-mist">
                  You requested this review — the backend requires a different user to decide it.
                </p>
              ) : null}
              <div className="mt-2.5">
                <label htmlFor="review-notes" className={labelCls}>
                  Review notes (optional)
                </label>
                <textarea
                  id="review-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={2}
                  placeholder="Recorded on the version as reviewer notes"
                  className={inputCls}
                />
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={approveRequest.isPending}
                  data-testid="approve-request"
                  onClick={() => {
                    setActionError(null);
                    approveRequest.mutate(
                      { policyId: policy.id, requestId: pendingRequest.id, reviewNotes: reviewNotes || null },
                      errOpts
                    );
                  }}
                  className={primaryBtn}
                >
                  {approveRequest.isPending ? <Loader2 size={14} className="animate-spin" /> : <ThumbsUp size={14} />}
                  Approve
                </button>
                <button
                  type="button"
                  disabled={rejectRequest.isPending}
                  data-testid="reject-request"
                  onClick={() => {
                    setActionError(null);
                    rejectRequest.mutate(
                      { policyId: policy.id, requestId: pendingRequest.id, reviewNotes: reviewNotes || null },
                      errOpts
                    );
                  }}
                  className={subtleBtn}
                >
                  {rejectRequest.isPending ? <Loader2 size={14} className="animate-spin" /> : <ThumbsDown size={14} />}
                  Reject
                </button>
              </div>
              <div className="mt-2.5 flex items-end gap-2">
                <div className="flex-1">
                  <label htmlFor="cancel-reason" className={labelCls}>
                    Or cancel the request (reason required)
                  </label>
                  <input
                    id="cancel-reason"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Why this review is being withdrawn"
                    className={inputCls}
                  />
                </div>
                <button
                  type="button"
                  disabled={cancelRequest.isPending || !cancelReason.trim()}
                  data-testid="cancel-request"
                  onClick={() => {
                    setActionError(null);
                    cancelRequest.mutate(
                      { policyId: policy.id, requestId: pendingRequest.id, reason: cancelReason.trim() },
                      errOpts
                    );
                  }}
                  className={subtleBtn}
                >
                  {cancelRequest.isPending ? <Loader2 size={14} className="animate-spin" /> : <Undo2 size={14} />}
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {/* ── Send for review ── */}
          {canSendForReview ? (
            submittableVersions.length > 0 ? (
              <div className="rounded-xl bg-white/45 p-3.5 ring-1 ring-white/60" data-testid="send-for-review">
                <p className="text-[13px] font-bold text-cv-ink">Send for review</p>
                <p className="mt-0.5 text-[11px] text-cv-slate">
                  Submits the version, assigns an approver, and moves the policy to under review.
                </p>
                <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="submit-version" className={labelCls}>
                      Version
                    </label>
                    <select
                      id="submit-version"
                      value={submitVersionId}
                      onChange={(e) => setSubmitVersionId(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">Select version…</option>
                      {submittableVersions.map((v) => (
                        <option key={v.id} value={v.id}>
                          v{v.version_number} ({v.status})
                          {v.change_summary ? ` — ${v.change_summary}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="submit-approver" className={labelCls}>
                      Approver
                    </label>
                    <select
                      id="submit-approver"
                      value={approverUserId}
                      onChange={(e) => setApproverUserId(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">
                        {users.isLoading
                          ? "Loading org users…"
                          : users.isError
                            ? "Could not load org users"
                            : "Select approver…"}
                      </option>
                      {activeUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name || u.email}
                          {u.id === myId ? " (you — cannot approve own request)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-2.5">
                  <label htmlFor="submit-notes" className={labelCls}>
                    Notes (optional)
                  </label>
                  <input
                    id="submit-notes"
                    value={submitNotes}
                    onChange={(e) => setSubmitNotes(e.target.value)}
                    placeholder="Context for the approver"
                    className={inputCls}
                  />
                </div>
                <button
                  type="button"
                  disabled={submitForReview.isPending || !submitVersionId || !approverUserId}
                  data-testid="submit-for-review"
                  onClick={() => {
                    setActionError(null);
                    submitForReview.mutate(
                      {
                        policyId: policy.id,
                        versionId: submitVersionId,
                        approverUserId,
                        notes: submitNotes || null,
                        policyStatus: policy.status
                      },
                      errOpts
                    );
                  }}
                  className={`${primaryBtn} mt-2.5 w-full`}
                >
                  {submitForReview.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Send for review
                </button>
              </div>
            ) : versions.length === 0 && !detail.versions.isLoading ? (
              <div className="rounded-xl bg-white/45 p-3.5 ring-1 ring-white/60">
                <p className="text-[12px] text-cv-slate">
                  This policy has no versions yet — add one below before sending it for review.
                </p>
              </div>
            ) : null
          ) : null}

          {/* ── Deprecate / Archive ── */}
          {policy.status === "approved" ? (
            <button
              type="button"
              disabled={updatePolicy.isPending}
              data-testid="deprecate-policy"
              onClick={() => {
                setActionError(null);
                updatePolicy.mutate({ policyId: policy.id, payload: { status: "deprecated" } }, errOpts);
              }}
              className={subtleBtn}
            >
              {updatePolicy.isPending ? <Loader2 size={14} className="animate-spin" /> : <Archive size={14} />}
              Deprecate policy
            </button>
          ) : null}
          {policy.status === "deprecated" ? (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label htmlFor="archive-reason" className={labelCls}>
                  Archive reason (required)
                </label>
                <input
                  id="archive-reason"
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  placeholder="Why this policy is being retired"
                  className={inputCls}
                />
              </div>
              <button
                type="button"
                disabled={archivePolicy.isPending || !archiveReason.trim()}
                data-testid="archive-policy"
                onClick={() => {
                  setActionError(null);
                  // Archived policies drop out of the default list, so close the modal on success.
                  archivePolicy.mutate(
                    { policyId: policy.id, reason: archiveReason.trim() },
                    { ...errOpts, onSuccess: () => onClose() }
                  );
                }}
                className={subtleBtn}
              >
                {archivePolicy.isPending ? <Loader2 size={14} className="animate-spin" /> : <Archive size={14} />}
                Archive
              </button>
            </div>
          ) : null}

          {actionError ? (
            <p className="text-[12px] font-medium text-rose-600" data-testid="policy-action-error">
              {actionError}
            </p>
          ) : null}

          {/* ── Version history ── */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[13px] font-bold text-cv-ink">
                <FileClock size={14} className="text-cv-mist" /> Version history
              </p>
              {policy.status !== "archived" ? (
                <button
                  type="button"
                  onClick={() => setShowNewVersion((s) => !s)}
                  data-testid="toggle-new-version"
                  className="cv-ring-focus rounded-full bg-white/60 px-3 py-1.5 text-[11px] font-bold text-cv-ink ring-1 ring-white/70 transition hover:bg-white"
                >
                  {showNewVersion ? "Close" : "New version"}
                </button>
              ) : null}
            </div>

            {showNewVersion ? (
              <div className="mt-2 space-y-2.5 rounded-xl bg-white/45 p-3 ring-1 ring-white/60" data-testid="new-version-form">
                <div>
                  <label htmlFor="new-version-number" className={labelCls}>
                    Version number
                  </label>
                  <input
                    id="new-version-number"
                    value={newVersionNumber}
                    onChange={(e) => setNewVersionNumber(e.target.value)}
                    placeholder="e.g. 1.1"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="new-version-content" className={labelCls}>
                    Content
                  </label>
                  <textarea
                    id="new-version-content"
                    value={newVersionContent}
                    onChange={(e) => setNewVersionContent(e.target.value)}
                    rows={3}
                    placeholder="Markdown policy text"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="new-version-summary" className={labelCls}>
                    Change summary (optional)
                  </label>
                  <input
                    id="new-version-summary"
                    value={newVersionSummary}
                    onChange={(e) => setNewVersionSummary(e.target.value)}
                    placeholder="What changed"
                    className={inputCls}
                  />
                </div>
                <button
                  type="button"
                  disabled={createVersion.isPending || !newVersionNumber.trim() || !newVersionContent.trim()}
                  data-testid="create-version"
                  onClick={() => {
                    setActionError(null);
                    createVersion.mutate(
                      {
                        policyId: policy.id,
                        payload: {
                          version_number: newVersionNumber.trim(),
                          content_snapshot_json: { content: newVersionContent },
                          change_summary: newVersionSummary.trim() || null
                        }
                      },
                      {
                        ...errOpts,
                        onSuccess: () => {
                          setShowNewVersion(false);
                          setNewVersionNumber("");
                          setNewVersionContent("");
                          setNewVersionSummary("");
                        }
                      }
                    );
                  }}
                  className={`${primaryBtn} w-full`}
                >
                  {createVersion.isPending ? <Loader2 size={14} className="animate-spin" /> : <FileClock size={14} />}
                  Add version
                </button>
              </div>
            ) : null}

            {detail.versions.isLoading ? (
              <div className="mt-2">
                <SkeletonRows rows={2} />
              </div>
            ) : detail.versions.isError ? (
              <p className="mt-2 text-[12px] text-rose-600">Unable to load version history.</p>
            ) : versions.length === 0 ? (
              <div className="mt-2">
                <EmptyState compact icon={FileClock} title="No versions yet" description="Add a version to make this policy reviewable." />
              </div>
            ) : (
              <ul className="mt-2 space-y-2" data-testid="version-history">
                {versions.map((v) => {
                  const content = versionContentText(v);
                  const expanded = expandedVersionId === v.id;
                  return (
                    <li key={v.id} className="rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-cv-ink">
                            v{v.version_number}
                            {v.change_summary ? (
                              <span className="ml-1.5 text-[11px] font-medium text-cv-slate">{v.change_summary}</span>
                            ) : null}
                          </p>
                          <p className="mt-0.5 text-[11px] text-cv-mist">
                            {formatDate(v.created_at) ?? v.created_at}
                            {v.submitted_by_user_id ? ` · submitted by ${userName(v.submitted_by_user_id)}` : ""}
                            {v.reviewed_by_user_id ? ` · reviewed by ${userName(v.reviewed_by_user_id)}` : ""}
                          </p>
                          {v.review_notes ? (
                            <p className="mt-0.5 text-[11px] text-cv-slate">Review notes: “{v.review_notes}”</p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {v.is_live ? <StatusBadge label="Live" tone="good" /> : null}
                          <StatusBadge label={v.status} tone={versionStatusTone(v.status)} />
                          {content ? (
                            <button
                              type="button"
                              aria-label={expanded ? "Hide content" : "Show content"}
                              onClick={() => setExpandedVersionId(expanded ? null : v.id)}
                              className="cv-ring-focus inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/60 text-cv-slate ring-1 ring-white/70 hover:text-cv-ink"
                            >
                              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                          ) : null}
                        </div>
                      </div>
                      {expanded && content ? (
                        <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg bg-white/60 p-2.5 text-[11px] leading-relaxed text-cv-slate ring-1 ring-white/70">
                          {content}
                        </pre>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* ── Approval history ── */}
          {approvals.length > 0 ? (
            <div>
              <p className="flex items-center gap-1.5 text-[13px] font-bold text-cv-ink">
                <CheckCircle2 size={14} className="text-cv-mist" /> Approval history
              </p>
              <ul className="mt-2 space-y-2" data-testid="approval-history">
                {approvals.map((r) => (
                  <li key={r.id} className="flex items-start justify-between gap-2 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-cv-ink">
                        {userName(r.requested_by_user_id)} → {userName(r.approver_user_id)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-cv-mist">
                        {formatDate(r.created_at) ?? r.created_at}
                        {r.decided_at ? ` · decided ${formatDate(r.decided_at) ?? r.decided_at}` : ""}
                        {r.notes ? ` · “${r.notes}”` : ""}
                      </p>
                    </div>
                    <StatusBadge label={r.status} tone={requestStatusTone(r.status)} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
