"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCheck, FileUp, Loader2, XCircle, type LucideIcon } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import type { PbcItem } from "@/lib/api/audit-pack";
import { getEvidence } from "@/lib/api/evidence";
import { usePbcAction } from "@/lib/hooks/useAuditPack";

const inputBase =
  "w-full rounded-2xl bg-white/65 px-3.5 py-2.5 text-sm text-cv-ink placeholder:text-cv-mist ring-1 ring-white/70 transition focus:outline-none focus:ring-2 focus:ring-cv-blue/45";
const labelBase = "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";

export type PbcAction = "submit" | "accept" | "reject";

const ACTION_META: Record<PbcAction, { title: string; icon: LucideIcon; accent: "blue" | "green" | "red"; cta: string }> = {
  submit: { title: "Submit PBC Item", icon: FileUp, accent: "blue", cta: "Submit item" },
  accept: { title: "Accept PBC Item", icon: CheckCheck, accent: "green", cta: "Accept item" },
  reject: { title: "Reject PBC Item", icon: XCircle, accent: "red", cta: "Reject item" }
};

/**
 * Status transitions for a PBC item:
 * POST /pbc-items/{id}/submit (optional evidence_id),
 * POST /pbc-items/{id}/accept (override_reason required by the backend when no evidence),
 * POST /pbc-items/{id}/reject (rejection_reason required).
 */
export function PbcActionModal({
  engagementId,
  item,
  action,
  onClose
}: {
  engagementId: string;
  item: PbcItem | null;
  action: PbcAction | null;
  onClose: () => void;
}) {
  const mutation = usePbcAction(engagementId);
  const [reason, setReason] = useState("");
  const [evidenceId, setEvidenceId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const open = Boolean(item && action);
  const evidence = useQuery({
    queryKey: ["evidence"],
    queryFn: () => getEvidence(),
    enabled: open && action === "submit"
  });

  const err = mutation.error instanceof ApiError ? mutation.error : null;
  const meta = action ? ACTION_META[action] : null;
  const needsOverride = action === "accept" && !item?.evidence_id;

  function resetAndClose() {
    setReason("");
    setEvidenceId("");
    setFormError(null);
    mutation.reset();
    onClose();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item || !action) return;
    setFormError(null);
    if (action === "reject" && !reason.trim()) {
      setFormError("A rejection reason is required.");
      return;
    }
    try {
      await mutation.mutateAsync({
        itemId: item.id,
        action,
        reason: reason.trim() || undefined,
        evidenceId: evidenceId || undefined
      });
      resetAndClose();
    } catch {
      // surfaced below via mutation.error
    }
  }

  if (!item || !action || !meta) return null;

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title={meta.title}
      subtitle={`“${item.title}” — currently ${item.status.replaceAll("_", " ")}`}
      icon={meta.icon}
      accent={meta.accent}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {action === "submit" ? (
          <div>
            <label htmlFor="pbc-evidence" className={labelBase}>
              Attach evidence <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <select id="pbc-evidence" value={evidenceId} onChange={(e) => setEvidenceId(e.target.value)} className={inputBase}>
              <option value="">
                {evidence.isLoading
                  ? "Loading evidence…"
                  : evidence.isError
                    ? "Evidence library unavailable"
                    : "No evidence attached"}
              </option>
              {(evidence.data ?? []).map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] leading-relaxed text-cv-slate">
              Items submitted without evidence can only be accepted with an explicit override reason.
            </p>
          </div>
        ) : null}

        {action === "accept" ? (
          <div>
            <label htmlFor="pbc-override" className={labelBase}>
              Override reason{" "}
              {needsOverride ? null : (
                <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
              )}
            </label>
            <textarea
              id="pbc-override"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder={
                needsOverride
                  ? "No evidence is attached — document why acceptance is proceeding without it"
                  : "Optional note for the acceptance record"
              }
              className={inputBase}
            />
            {needsOverride ? (
              <p className="mt-1.5 text-[11px] leading-relaxed text-amber-700">
                This item has no evidence attached. The backend requires an override reason to accept it.
              </p>
            ) : null}
          </div>
        ) : null}

        {action === "reject" ? (
          <div>
            <label htmlFor="pbc-reject" className={labelBase}>
              Rejection reason
            </label>
            <textarea
              id="pbc-reject"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="What is missing or wrong with the submission"
              className={inputBase}
            />
          </div>
        ) : null}

        {formError ? (
          <p className="rounded-2xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">
            {formError}
          </p>
        ) : null}
        {err ? (
          <p className="rounded-2xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">
            {err.message}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={resetAndClose}
            className="cv-ring-focus rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-4 py-2 text-xs font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {mutation.isPending ? <Loader2 size={13} className="animate-spin" /> : null}
            {meta.cta}
          </button>
        </div>
      </form>
    </Modal>
  );
}
