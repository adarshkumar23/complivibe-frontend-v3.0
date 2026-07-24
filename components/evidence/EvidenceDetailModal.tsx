"use client";

import { useState } from "react";
import { Download, FileText, Loader2, Sparkles, Unlink, UserCheck, Upload } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { ApiError } from "@/lib/api/client";
import { EntitlementBanner } from "@/components/common/EntitlementBanner";
import { formatDate } from "@/lib/utils/format";
import { getEvidenceFileUrl, EVIDENCE_ALLOWED_EXTENSIONS, EVIDENCE_MAX_UPLOAD_BYTES, type EvidenceReviewStatus } from "@/lib/api/evidence";
import { useEvidenceDetail, useEvidenceAiAssessment, useUnlinkEvidenceControl, useUploadEvidenceFile, useReviewEvidence } from "@/lib/hooks/useEvidence";
import { useHasPermission } from "@/lib/hooks/usePermissions";

const REVIEW_ACTIONS: { status: EvidenceReviewStatus; label: string; tone: string }[] = [
  { status: "verified", label: "Verify", tone: "bg-emerald-600 hover:bg-emerald-500" },
  { status: "needs_review", label: "Needs more info", tone: "bg-amber-600 hover:bg-amber-500" },
  { status: "rejected", label: "Reject", tone: "bg-rose-600 hover:bg-rose-500" },
];

function fileExt(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

type Tone = "good" | "warn" | "bad" | "info" | "neutral" | "purple" | "teal";

function reviewTone(status: string): Tone {
  switch (status) {
    case "verified": return "good";
    case "rejected": return "bad";
    case "needs_review": return "warn";
    default: return "neutral";
  }
}

function aiTone(status: string): Tone {
  switch (status) {
    case "suggested_valid": return "teal";
    case "suggested_incomplete": return "warn";
    case "suggested_mismatch": return "bad";
    default: return "neutral";
  }
}

/**
 * Evidence detail: metadata, download (via signed URL), the HUMAN review verdict,
 * and — kept visually separate — the AI assessment SUGGESTION. The two are never
 * allowed to look like the same thing.
 */
export function EvidenceDetailModal({ evidenceId, open, onClose }: { evidenceId: string | null; open: boolean; onClose: () => void }) {
  const detail = useEvidenceDetail(evidenceId);
  const assessment = useEvidenceAiAssessment(evidenceId);
  const unlink = useUnlinkEvidenceControl();
  const upload = useUploadEvidenceFile();
  const review = useReviewEvidence();
  const canWrite = useHasPermission("evidence:write");
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewFormError, setReviewFormError] = useState<string | null>(null);

  const ev = detail.data;

  async function onReview(reviewStatus: EvidenceReviewStatus) {
    if (!evidenceId) return;
    setReviewFormError(null);
    if (reviewStatus === "rejected" && !reviewNotes.trim()) {
      setReviewFormError("A note is required to reject evidence.");
      return;
    }
    try {
      await review.mutateAsync({ evidenceId, reviewStatus, reviewNotes });
      setReviewNotes("");
    } catch {
      // ApiError surfaced via EntitlementBanner below
    }
  }

  async function onAttach(e: React.ChangeEvent<HTMLInputElement>) {
    setAttachError(null);
    const f = e.target.files?.[0] ?? null;
    e.target.value = ""; // allow re-selecting the same file after an error
    if (!f || !evidenceId) return;
    const ext = fileExt(f.name);
    if (!EVIDENCE_ALLOWED_EXTENSIONS.includes(ext as (typeof EVIDENCE_ALLOWED_EXTENSIONS)[number])) {
      setAttachError(`File type "${ext || "(none)"}" is not allowed. Permitted: ${EVIDENCE_ALLOWED_EXTENSIONS.join(", ")}.`);
      return;
    }
    if (f.size > EVIDENCE_MAX_UPLOAD_BYTES) {
      setAttachError(`File is too large (${(f.size / 1_048_576).toFixed(1)} MB). Maximum is ${(EVIDENCE_MAX_UPLOAD_BYTES / 1_048_576).toFixed(0)} MB.`);
      return;
    }
    try {
      await upload.mutateAsync({ evidenceId, file: f });
      await detail.refetch();
    } catch (err) {
      setAttachError(err instanceof ApiError ? err.message : "Could not upload the file.");
    }
  }

  async function onDownload() {
    if (!evidenceId) return;
    setDownloadError(null);
    setDownloading(true);
    try {
      const { url } = await getEvidenceFileUrl(evidenceId);
      window.open(url, "_blank", "noopener");
    } catch (e) {
      setDownloadError(e instanceof ApiError ? e.message : "Could not generate a download link.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={ev?.title ?? "Evidence"} subtitle="Evidence record" icon={FileText} accent="green" widthClassName="max-w-2xl">
      {detail.isLoading ? (
        <SkeletonRows rows={6} />
      ) : detail.isError || !ev ? (
        <ErrorState title="Unable to load evidence" onRetry={() => detail.refetch()} />
      ) : (
        <div className="space-y-4">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 text-[12px]">
            <Meta label="Type" value={ev.evidence_type?.replaceAll("_", " ") ?? "—"} />
            <Meta label="Source" value={ev.source?.replaceAll("_", " ") ?? "—"} />
            <Meta label="Valid from" value={ev.valid_from ? formatDate(ev.valid_from) ?? ev.valid_from : "—"} />
            <Meta label="Valid until" value={ev.valid_until ? formatDate(ev.valid_until) ?? ev.valid_until : "—"} />
          </div>
          {ev.description ? <p className="text-[13px] leading-relaxed text-cv-slate">{ev.description}</p> : null}

          {/* File / URL + download */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/50 px-3.5 py-2.5 ring-1 ring-white/60">
            <div className="min-w-0 text-[12px]">
              {ev.file_name ? (
                <span className="text-cv-ink">
                  <span className="font-semibold">{ev.file_name}</span>
                  {ev.size_bytes ? <span className="text-cv-mist"> · {(ev.size_bytes / 1024).toFixed(0)} KB</span> : null}
                </span>
              ) : ev.external_reference_url ? (
                <a href={ev.external_reference_url} target="_blank" rel="noopener noreferrer" className="text-cv-blue hover:underline">
                  {ev.external_reference_url}
                </a>
              ) : (
                <span data-testid="evidence-no-file" className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" /> No file attached
                </span>
              )}
            </div>
            {ev.file_name ? (
              <button
                type="button"
                data-testid="evidence-download"
                onClick={onDownload}
                disabled={downloading}
                className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white disabled:opacity-70"
              >
                {downloading ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} strokeWidth={2.6} />}
                Download
              </button>
            ) : !ev.external_reference_url && canWrite ? (
              <label
                data-testid="evidence-attach-file"
                className="cv-ring-focus inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-cv-brand-soft px-3 py-1.5 text-[11px] font-semibold text-cv-blue ring-1 ring-blue-400/25 transition hover:bg-cv-brand-soft/80 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-70"
              >
                {upload.isPending ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} strokeWidth={2.6} />}
                {upload.isPending ? "Uploading…" : "Attach file"}
                <input
                  type="file"
                  className="hidden"
                  accept={EVIDENCE_ALLOWED_EXTENSIONS.join(",")}
                  disabled={upload.isPending}
                  onChange={onAttach}
                />
              </label>
            ) : null}
          </div>
          {!ev.file_name && !ev.external_reference_url ? (
            <p className="text-[11px] text-amber-700/80">
              This is a metadata-only record — no file has been attached yet.
              {canWrite ? " Use “Attach file” above to add one." : null}
            </p>
          ) : null}
          {attachError ? <p className="text-[11px] font-semibold text-rose-600">{attachError}</p> : null}
          {downloadError ? <p className="text-[11px] font-semibold text-rose-600">{downloadError}</p> : null}

          {/* HUMAN review verdict — authoritative */}
          <div className="rounded-2xl border border-cv-ink/10 bg-white/55 p-3.5">
            <div className="mb-1.5 flex items-center gap-1.5">
              <UserCheck size={13} className="text-cv-slate" />
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate">Human review status</span>
            </div>
            <span data-testid="evidence-review-status" data-status={ev.review_status} className="inline-flex">
              <StatusBadge label={ev.review_status.replaceAll("_", " ")} tone={reviewTone(ev.review_status)} />
            </span>
            <p className="mt-1.5 text-[11px] text-cv-mist">Set by a human reviewer — the authoritative verdict.</p>
            {ev.review_notes ? <p className="mt-1 text-[12px] text-cv-slate">{ev.review_notes}</p> : null}

            {canWrite ? (
              <div className="mt-3 border-t border-cv-ink/10 pt-3" data-testid="evidence-review-controls">
                <label htmlFor="evidence-review-notes" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-cv-mist">
                  Reviewer note <span className="font-medium normal-case tracking-normal">(required to reject)</span>
                </label>
                <textarea
                  id="evidence-review-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={2}
                  placeholder="Why this verdict? (visible on the record)"
                  className="w-full rounded-2xl bg-white/65 px-3 py-2 text-[12px] text-cv-ink placeholder:text-cv-mist ring-1 ring-white/70 focus:outline-none focus:ring-2 focus:ring-cv-blue/45"
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {REVIEW_ACTIONS.map((a) => (
                    <button
                      key={a.status}
                      type="button"
                      data-testid={`evidence-review-${a.status}`}
                      disabled={review.isPending}
                      onClick={() => onReview(a.status)}
                      className={`cv-ring-focus inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${a.tone}`}
                    >
                      {review.isPending ? <Loader2 size={11} className="animate-spin" /> : null}
                      {a.label}
                    </button>
                  ))}
                </div>
                {reviewFormError ? <p className="mt-1.5 text-[11px] font-semibold text-rose-600">{reviewFormError}</p> : null}
                <EntitlementBanner error={review.error instanceof ApiError ? review.error : null} />
              </div>
            ) : null}
          </div>

          {/* AI assessment — SUGGESTION, visually distinct (dashed indigo) */}
          <div className="rounded-2xl border-2 border-dashed border-indigo-400/40 bg-indigo-500/[0.06] p-3.5">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Sparkles size={13} className="text-indigo-500" />
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-indigo-600">AI assessment</span>
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">AI suggestion — not a verdict</span>
            </div>
            {assessment.isLoading ? (
              <p className="text-[12px] text-cv-mist">Checking for an assessment…</p>
            ) : assessment.data == null ? (
              <p data-testid="evidence-ai-pending" className="text-[12px] text-cv-slate">
                Not yet assessed — this runs automatically in the background shortly after upload.
              </p>
            ) : (
              <div className="space-y-1.5">
                <span data-testid="evidence-ai-status" data-status={assessment.data.ai_assessment_status} className="inline-flex">
                  <StatusBadge
                    label={assessment.data.ai_assessment_status.replaceAll("_", " ")}
                    tone={aiTone(assessment.data.ai_assessment_status)}
                  />
                </span>
                <p className="text-[12px] leading-relaxed text-cv-slate">{assessment.data.explanation}</p>
                {assessment.data.appears_to_be ? <p className="text-[11px] text-cv-slate"><span className="font-semibold text-cv-ink">Appears to be:</span> {assessment.data.appears_to_be}</p> : null}
                {assessment.data.appears_to_cover ? <p className="text-[11px] text-cv-slate"><span className="font-semibold text-cv-ink">Appears to cover:</span> {assessment.data.appears_to_cover}</p> : null}
                {assessment.data.missing_or_mismatched.length > 0 ? (
                  <ul className="ml-4 list-disc text-[11px] text-cv-slate">
                    {assessment.data.missing_or_mismatched.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                ) : null}
              </div>
            )}
          </div>

          {/* Linked controls */}
          <div>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate">Linked controls</span>
            {ev.linked_controls.length === 0 ? (
              <p className="text-[12px] text-cv-mist">No controls linked.</p>
            ) : (
              <ul className="space-y-1.5">
                {ev.linked_controls.map((c) => (
                  <li key={c.control_id} className="flex items-center justify-between gap-2 rounded-2xl bg-white/50 px-3 py-2 ring-1 ring-white/60">
                    <span className="min-w-0 truncate text-[12px] font-semibold text-cv-ink">{c.title}</span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <StatusBadge label={c.status.replaceAll("_", " ")} tone="neutral" />
                      {canWrite ? (
                        <button
                          type="button"
                          aria-label={`Unlink ${c.title}`}
                          data-testid={`evidence-unlink-${c.control_id}`}
                          onClick={() => evidenceId && unlink.mutate({ evidenceId, controlId: c.control_id })}
                          disabled={unlink.isPending}
                          className="cv-ring-focus inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/60 text-cv-slate ring-1 ring-white/70 transition hover:bg-white hover:text-rose-600 disabled:opacity-60"
                        >
                          <Unlink size={11} strokeWidth={2.4} />
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-cv-mist">{label}</span>
      <span className="text-[12px] text-cv-ink">{value}</span>
    </div>
  );
}
