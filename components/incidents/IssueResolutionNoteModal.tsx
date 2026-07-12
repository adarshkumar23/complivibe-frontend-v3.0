"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";
import { ApiError } from "@/lib/api/client";
import { useTransitionIssue } from "@/lib/hooks/useIncidentsPage";

const labelCls = "text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";
const inputCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-sm text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none";

/**
 * The backend rejects resolved -> closed transitions without a non-empty
 * resolution_note (issue_service.py transition_issue). This modal exists
 * only to collect that note — every other transition needs no extra input.
 */
export function IssueResolutionNoteModal({
  open,
  onClose,
  issueId,
  issueTitle
}: {
  open: boolean;
  onClose: () => void;
  issueId: string | null;
  issueTitle: string;
}) {
  const transition = useTransitionIssue();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setNote("");
    setError(null);
    transition.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueId) return;
    setError(null);
    try {
      await transition.mutateAsync({ id: issueId, newStatus: "closed", resolutionNote: note });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Request failed — the backend may be unavailable.");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Close Issue" subtitle={issueTitle} icon={CheckCircle2} accent="green">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="resolution-note" className={labelCls}>
            Resolution note
          </label>
          <textarea
            id="resolution-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            required
            minLength={1}
            rows={3}
            placeholder="Required by the backend to close a resolved issue — summarize the fix and verification."
            className={cn(inputCls, "resize-y")}
          />
        </div>

        {error ? (
          <p role="alert" className="rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">
            {error}
          </p>
        ) : null}

        <div className="mt-1 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="cv-ring-focus rounded-full bg-white/60 px-4 py-2 text-[13px] font-semibold text-cv-slate ring-1 ring-white/70 transition hover:bg-white hover:text-cv-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={transition.isPending}
            className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-5 py-2 text-[13px] font-semibold text-white shadow-tile transition hover:opacity-90 disabled:opacity-60"
          >
            {transition.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            Close issue
          </button>
        </div>
      </form>
    </Modal>
  );
}
