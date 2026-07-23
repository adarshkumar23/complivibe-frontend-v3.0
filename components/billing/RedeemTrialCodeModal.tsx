"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Ticket, TriangleAlert } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { redeemRejectionMessage } from "@/lib/api/entitlement";
import { useRedeemTrialCode } from "@/lib/hooks/useBilling";

const inputCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-sm font-medium tracking-wide text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none";

export function RedeemTrialCodeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [code, setCode] = useState("");
  const redeem = useRedeemTrialCode();
  const status = redeem.data;

  function close() {
    setCode("");
    redeem.reset();
    onClose();
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || redeem.isPending) return;
    redeem.mutate(code);
  }

  return (
    <Modal open={open} onClose={close} title="Redeem a trial code" subtitle="Unlock a 14-day full-feature trial" icon={Ticket} accent="blue">
      {status ? (
        <div className="space-y-4" data-testid="redeem-success">
          <div className="flex items-start gap-3 rounded-2xl bg-emerald-500/10 px-4 py-3.5 ring-1 ring-emerald-400/25">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
            <div className="text-sm text-emerald-800">
              <p className="font-bold">Your trial is active.</p>
              <p className="mt-0.5 text-[13px] text-emerald-700">
                You now have full access for {status.trial_days_remaining ?? 14} days. Every premium feature is unlocked —
                the app has already refreshed to reflect it.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={close}
              className="cv-ring-focus rounded-xl bg-cv-brand px-5 py-2.5 text-[13px] font-semibold text-white shadow-tile transition hover:opacity-90"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="trial-code" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate">
              Trial code
            </label>
            <input
              id="trial-code"
              type="text"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CV-XXXX-XXXX-XXXX"
              className={inputCls}
              data-testid="redeem-code-input"
            />
          </div>

          {redeem.isError ? (
            <div
              className="flex items-start gap-2.5 rounded-2xl bg-rose-500/10 px-3.5 py-2.5 ring-1 ring-rose-400/25"
              data-testid="redeem-error"
            >
              <TriangleAlert size={15} className="mt-0.5 shrink-0 text-rose-600" />
              <p className="text-xs leading-relaxed text-rose-700">{redeemRejectionMessage(redeem.error)}</p>
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button type="button" onClick={close} className="cv-ring-focus rounded-xl bg-white/55 px-4 py-2.5 text-[13px] font-semibold text-cv-slate ring-1 ring-white/70 transition hover:bg-white">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!code.trim() || redeem.isPending}
              className="cv-ring-focus inline-flex items-center gap-2 rounded-xl bg-cv-brand px-5 py-2.5 text-[13px] font-semibold text-white shadow-tile transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              data-testid="redeem-submit"
            >
              {redeem.isPending ? <><Loader2 size={15} className="animate-spin" /> Redeeming…</> : "Redeem code"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
