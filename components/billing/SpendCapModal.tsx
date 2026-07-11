"use client";

import { useEffect, useState } from "react";
import { Loader2, PiggyBank } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";
import type { UsageDashboard } from "@/lib/api/billing";
import { ApiError } from "@/lib/api/client";
import { useSetSpendCap } from "@/lib/hooks/useBilling";

const labelCls = "text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";
const inputCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-sm text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none";

/**
 * Usage spend-cap control (POST /api/v1/billing/usage/spend-cap). Seeds from
 * the live usage dashboard so the toggle reflects the real current state.
 */
export function SpendCapModal({
  open,
  onClose,
  usage
}: {
  open: boolean;
  onClose: () => void;
  usage: UsageDashboard | undefined;
}) {
  const setCap = useSetSpendCap();

  const [enabled, setEnabled] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setCap.reset();
    setEnabled(usage?.usage_spend_cap_enabled ?? false);
    setAmount(usage?.usage_spend_cap_inr != null ? String(usage.usage_spend_cap_inr) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cap = amount.trim() === "" ? null : Number(amount);
    if (enabled && (cap == null || !Number.isFinite(cap) || cap < 0)) {
      setError("Enter a non-negative cap amount in INR to enable the spend cap.");
      return;
    }
    try {
      await setCap.mutateAsync({
        usage_spend_cap_enabled: enabled,
        usage_spend_cap_inr: enabled ? cap : null
      });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Request failed — the backend may be unavailable.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Usage Spend Cap"
      subtitle="Alert threshold for metered usage cost"
      icon={PiggyBank}
      accent="purple"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70">
          <span>
            <span className="block text-[13px] font-semibold text-cv-ink">Enable spend cap</span>
            <span className="block text-[11px] text-cv-slate">
              Flags the usage dashboard when the estimated period cost crosses the cap.
            </span>
          </span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 accent-[#4f46e5]"
          />
        </label>

        <div className={cn("flex flex-col gap-1.5", !enabled && "opacity-50")}>
          <label htmlFor="cap-amount" className={labelCls}>
            Cap amount (₹ / period)
          </label>
          <input
            id="cap-amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            disabled={!enabled}
            placeholder="e.g. 50000"
            className={inputCls}
          />
        </div>

        {usage ? (
          <p className="text-[11px] text-cv-mist">
            Current estimated period cost: ₹{usage.current_estimated_cost_inr} · projected month-end: ₹
            {usage.projected_month_end_cost_inr}
          </p>
        ) : null}

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
            disabled={setCap.isPending}
            className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-5 py-2 text-[13px] font-semibold text-white shadow-tile transition hover:opacity-90 disabled:opacity-60"
          >
            {setCap.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            Save cap
          </button>
        </div>
      </form>
    </Modal>
  );
}
