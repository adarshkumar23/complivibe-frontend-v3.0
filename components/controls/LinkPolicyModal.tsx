"use client";

import { useState } from "react";
import { FileText, Loader2, ShieldAlert } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { usePoliciesList, useLinkControlToPolicy } from "@/lib/hooks/useControls";
import type { ControlPreset } from "@/components/controls/MapObligationModal";

const inputBase =
  "w-full rounded-2xl bg-white/65 px-3.5 py-2.5 text-sm text-cv-ink placeholder:text-cv-mist ring-1 ring-white/70 transition focus:outline-none focus:ring-2 focus:ring-cv-blue/45";

const labelBase = "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";

/**
 * Links a control to a compliance policy via
 * POST /api/v1/compliance/policies/{policy_id}/links/controls.
 */
export function LinkPolicyModal({
  open,
  onClose,
  control
}: {
  open: boolean;
  onClose: () => void;
  control: ControlPreset | null;
}) {
  const policies = usePoliciesList(open);
  const link = useLinkControlToPolicy();

  const [policyId, setPolicyId] = useState("");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const err = link.error instanceof ApiError ? link.error : null;
  const featureGated = err?.status === 403;

  function resetAndClose() {
    setPolicyId("");
    setReason("");
    setFormError(null);
    link.reset();
    onClose();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!control) return;
    if (!policyId) {
      setFormError("Select the policy this control implements.");
      return;
    }
    try {
      await link.mutateAsync({
        policyId,
        body: { control_id: control.controlId, link_reason: reason.trim() || null }
      });
      resetAndClose();
    } catch {
      // error surfaced below
    }
  }

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title="Link Control to Policy"
      subtitle="Record which policy this control implements"
      icon={FileText}
      accent="teal"
      widthClassName="max-w-lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {control ? (
            <div>
              <span className={labelBase}>Control</span>
              <div className="rounded-2xl bg-blue-500/10 px-3.5 py-2.5 ring-1 ring-blue-400/30">
                <p className="text-[13px] font-semibold text-cv-ink">
                  {control.controlCode ? <span className="mr-1.5 text-cv-blue">{control.controlCode}</span> : null}
                  {control.title}
                </p>
              </div>
            </div>
          ) : null}

          <div>
            <label htmlFor="link-policy" className={labelBase}>
              Policy
            </label>
            <select
              id="link-policy"
              value={policyId}
              onChange={(e) => setPolicyId(e.target.value)}
              className={inputBase}
              disabled={policies.isLoading}
            >
              <option value="">
                {policies.isLoading
                  ? "Loading policies…"
                  : policies.isError
                    ? "Could not load policies"
                    : (policies.data ?? []).length === 0
                      ? "No policies exist yet"
                      : "Select a policy…"}
              </option>
              {(policies.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="link-reason" className={labelBase}>
              Link reason <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <textarea
              id="link-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="How this control implements the policy"
              className={inputBase}
            />
          </div>
        </div>

        {formError ? (
          <p className="rounded-2xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">
            {formError}
          </p>
        ) : null}
        {err ? (
          featureGated ? (
            <div className="flex items-start gap-2.5 rounded-2xl bg-amber-500/10 px-3.5 py-2.5 ring-1 ring-amber-400/25">
              <ShieldAlert size={15} className="mt-0.5 shrink-0 text-amber-600" />
              <p className="text-xs leading-relaxed text-amber-700">
                <span className="font-bold">Plan upgrade required.</span> {err.message}
              </p>
            </div>
          ) : (
            <p className="rounded-2xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">
              {err.message}
            </p>
          )
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
            disabled={link.isPending}
            className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-4 py-2 text-xs font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {link.isPending ? <Loader2 size={13} className="animate-spin" /> : null}
            Link policy
          </button>
        </div>
      </form>
    </Modal>
  );
}
