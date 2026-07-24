"use client";

import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { useHasPermission } from "@/lib/hooks/usePermissions";

type Decision = "approve" | "reject";

/** Approve / reject / sign controls for one approval-queue row. Reject always
 * requires a reason; approve requires one only when the backend does (execution
 * approvals). Backend rules (incl. four-eyes "cannot approve your own review")
 * are surfaced verbatim via the error line. Hidden entirely without `permission`. */
export function ApprovalRowActions({
  onDecide,
  permission,
  approveNeedsReason = false
}: {
  onDecide: (decision: Decision, notes: string) => Promise<unknown>;
  permission: string;
  approveNeedsReason?: boolean;
}) {
  const canAct = useHasPermission(permission);
  const [mode, setMode] = useState<null | Decision>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canAct) return null;

  const reasonRequired = mode === "reject" || (mode === "approve" && approveNeedsReason);

  async function confirm() {
    if (!mode) return;
    setError(null);
    if (reasonRequired && !notes.trim()) {
      setError(mode === "reject" ? "A reason is required to reject." : "A reason is required.");
      return;
    }
    setBusy(true);
    try {
      await onDecide(mode, notes.trim());
      setMode(null);
      setNotes("");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  if (mode) {
    return (
      <div className="mt-2 space-y-1.5" data-testid="approval-decision-form">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder={reasonRequired ? "Reason (required)…" : "Decision note (optional)…"}
          className="w-full rounded-xl bg-white/70 px-2.5 py-1.5 text-[11px] text-cv-ink ring-1 ring-white/70 focus:outline-none focus:ring-2 focus:ring-cv-blue/40"
        />
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            data-testid={`approval-confirm-${mode}`}
            onClick={confirm}
            disabled={busy}
            className={`cv-ring-focus inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold text-white shadow-button disabled:opacity-60 ${mode === "approve" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"}`}
          >
            {busy ? <Loader2 size={10} className="animate-spin" /> : null} Confirm {mode}
          </button>
          <button type="button" onClick={() => { setMode(null); setNotes(""); setError(null); }} className="cv-ring-focus rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold text-cv-slate ring-1 ring-white/70 hover:bg-white">
            Cancel
          </button>
        </div>
        {error ? <p className="text-[10px] font-semibold text-rose-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-1.5">
      <button type="button" data-testid="approval-approve" onClick={() => setMode("approve")} className="cv-ring-focus inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white shadow-button transition hover:bg-emerald-500">
        <Check size={11} strokeWidth={2.8} /> Approve
      </button>
      <button type="button" data-testid="approval-reject" onClick={() => setMode("reject")} className="cv-ring-focus inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold text-cv-slate ring-1 ring-white/70 transition hover:text-rose-600">
        <X size={11} strokeWidth={2.8} /> Reject
      </button>
    </div>
  );
}
