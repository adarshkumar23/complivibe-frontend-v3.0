"use client";

import { useState } from "react";
import { Loader2, Paperclip } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { EntitlementBanner } from "@/components/common/EntitlementBanner";
import { useEvidence, useLinkEvidenceControl } from "@/lib/hooks/useEvidence";
import { EvidenceCreateModal } from "@/components/evidence/EvidenceCreateModal";

const inputBase =
  "w-full rounded-2xl bg-white/65 px-3.5 py-2.5 text-sm text-cv-ink placeholder:text-cv-mist ring-1 ring-white/70 transition focus:outline-none focus:ring-2 focus:ring-cv-blue/45";
const labelBase = "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";

/**
 * Attach evidence to a control from the control row. Either link an existing
 * evidence item (POST /evidence/{id}/controls) or create a new one pre-linked to
 * this control (reuses EvidenceCreateModal with presetControlId).
 */
export function AttachEvidenceModal({
  controlId,
  controlTitle,
  open,
  onClose,
}: {
  controlId: string;
  controlTitle: string;
  open: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const { evidence } = useEvidence();
  const link = useLinkEvidenceControl();
  const [evidenceId, setEvidenceId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const list = evidence.data ?? [];
  const err = link.error instanceof ApiError ? link.error : null;

  function resetAndClose() {
    setMode("existing");
    setEvidenceId("");
    setFormError(null);
    link.reset();
    onClose();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!evidenceId) {
      setFormError("Select the evidence item to link.");
      return;
    }
    try {
      await link.mutateAsync({ evidenceId, controlId });
      resetAndClose();
    } catch {
      // surfaced below
    }
  }

  // NEW mode simply delegates to the create modal, pre-linked to this control.
  if (mode === "new") {
    return <EvidenceCreateModal open={open} onClose={resetAndClose} presetControlId={controlId} />;
  }

  return (
    <Modal open={open} onClose={resetAndClose} title="Attach Evidence" subtitle={`Link evidence to “${controlTitle}”`} icon={Paperclip} accent="green" widthClassName="max-w-lg">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            data-testid="attach-mode-existing"
            onClick={() => setMode("existing")}
            className="cv-ring-focus rounded-full bg-cv-brand px-3 py-1.5 text-[11px] font-semibold text-white ring-1 ring-transparent"
          >
            Link existing
          </button>
          <button
            type="button"
            data-testid="attach-mode-new"
            onClick={() => setMode("new")}
            className="cv-ring-focus rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white"
          >
            Create new
          </button>
        </div>

        <div>
          <label htmlFor="attach-evidence-select" className={labelBase}>Evidence</label>
          <select
            id="attach-evidence-select"
            value={evidenceId}
            onChange={(e) => setEvidenceId(e.target.value)}
            className={inputBase}
            disabled={evidence.isLoading}
          >
            <option value="">
              {evidence.isLoading ? "Loading evidence…" : evidence.isError ? "Could not load evidence" : list.length === 0 ? "No evidence exists yet" : "Select evidence…"}
            </option>
            {list.map((e) => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>

        {formError ? (
          <p className="rounded-2xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">{formError}</p>
        ) : null}
        <EntitlementBanner error={err} />

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button type="button" onClick={resetAndClose} className="cv-ring-focus rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white">Cancel</button>
          <button
            type="submit"
            data-testid="attach-existing-submit"
            disabled={link.isPending}
            className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-4 py-2 text-xs font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {link.isPending ? <Loader2 size={13} className="animate-spin" /> : null}
            Link evidence
          </button>
        </div>
      </form>
    </Modal>
  );
}
