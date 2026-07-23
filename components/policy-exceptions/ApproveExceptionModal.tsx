"use client";

import { useState } from "react";
import { Loader2, CircleCheckBig } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { EntitlementBanner } from "@/components/common/EntitlementBanner";
import { useApprovePolicyException } from "@/lib/hooks/usePolicyExceptions";
import type { PolicyException } from "@/lib/api/policy-exceptions";

const inputBase =
  "w-full rounded-2xl bg-white/65 px-3.5 py-2.5 text-sm text-cv-ink placeholder:text-cv-mist ring-1 ring-white/70 transition focus:outline-none focus:ring-2 focus:ring-cv-blue/45";

const labelBase = "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";

/** Approve form for POST /api/v1/compliance/policy-exceptions/{id}/approve — asks for expiry_date. */
export function ApproveExceptionModal({
  exception,
  onClose,
  onApproved
}: {
  exception: PolicyException | null;
  onClose: () => void;
  onApproved?: (exception: PolicyException) => void;
}) {
  const approve = useApprovePolicyException();

  const [expiryDate, setExpiryDate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const err = approve.error instanceof ApiError ? approve.error : null;

  function resetAndClose() {
    setExpiryDate("");
    setFormError(null);
    approve.reset();
    onClose();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!exception) return;
    if (!expiryDate) {
      setFormError("Choose an expiry date for this exception.");
      return;
    }
    try {
      const updated = await approve.mutateAsync({ exceptionId: exception.id, expiryDate });
      onApproved?.(updated);
      resetAndClose();
    } catch {
      // error surfaced below via approve.error
    }
  }

  // Default the date picker's minimum to today so an expiry can't be set in the past.
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Modal
      open={exception !== null}
      onClose={resetAndClose}
      title="Approve exception"
      subtitle="Set the date this exception expires"
      icon={CircleCheckBig}
      accent="green"
      widthClassName="max-w-md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {exception?.reason ? (
          <div className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate">Requested reason</p>
            <p className="mt-1 text-[13px] leading-snug text-cv-ink">{exception.reason}</p>
          </div>
        ) : null}

        <div>
          <label htmlFor="exception-expiry" className={labelBase}>
            Expiry date
          </label>
          <input
            id="exception-expiry"
            type="date"
            value={expiryDate}
            min={today}
            onChange={(e) => setExpiryDate(e.target.value)}
            className={inputBase}
          />
        </div>

        {formError ? (
          <p className="rounded-2xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">
            {formError}
          </p>
        ) : null}
        <EntitlementBanner error={err} />

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
            disabled={approve.isPending}
            className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {approve.isPending ? <Loader2 size={13} className="animate-spin" /> : null}
            Approve exception
          </button>
        </div>
      </form>
    </Modal>
  );
}
