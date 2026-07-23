"use client";

import { useState } from "react";
import { Loader2, FileWarning } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { EntitlementBanner } from "@/components/common/EntitlementBanner";
import { useCreatePolicyException, usePolicyPicker } from "@/lib/hooks/usePolicyExceptions";
import type { PolicyException, PolicyExceptionCreatePayload } from "@/lib/api/policy-exceptions";

const inputBase =
  "w-full rounded-2xl bg-white/65 px-3.5 py-2.5 text-sm text-cv-ink placeholder:text-cv-mist ring-1 ring-white/70 transition focus:outline-none focus:ring-2 focus:ring-cv-blue/45";

const labelBase = "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";

/** Request-an-exception form for POST /api/v1/compliance/policy-exceptions. */
export function RequestExceptionModal({
  open,
  onClose,
  onCreated
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (exception: PolicyException) => void;
}) {
  const create = useCreatePolicyException();
  const policies = usePolicyPicker();

  const [policyId, setPolicyId] = useState("");
  const [reason, setReason] = useState("");
  const [compensating, setCompensating] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const err = create.error instanceof ApiError ? create.error : null;

  function resetAndClose() {
    setPolicyId("");
    setReason("");
    setCompensating("");
    setFormError(null);
    create.reset();
    onClose();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!policyId) {
      setFormError("Choose the policy this exception applies to.");
      return;
    }
    if (reason.trim().length < 1) {
      setFormError("Give a reason for the exception.");
      return;
    }
    const body: PolicyExceptionCreatePayload = {
      policy_id: policyId,
      reason: reason.trim(),
      compensating_measure_description: compensating.trim() || null
    };
    try {
      const created = await create.mutateAsync(body);
      onCreated?.(created);
      resetAndClose();
    } catch {
      // error surfaced below via create.error
    }
  }

  const policyList = policies.data ?? [];

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title="Request policy exception"
      subtitle="A different reviewer must approve it (four-eyes control)"
      icon={FileWarning}
      accent="amber"
      widthClassName="max-w-xl"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="exception-policy" className={labelBase}>
            Policy
          </label>
          <select
            id="exception-policy"
            value={policyId}
            onChange={(e) => setPolicyId(e.target.value)}
            className={inputBase}
            disabled={policies.isLoading}
          >
            <option value="">
              {policies.isLoading ? "Loading policies…" : "Select a policy…"}
            </option>
            {policyList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          {policies.isError ? (
            <p className="mt-1 text-[11px] font-semibold text-rose-600">Could not load policies. Try again.</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="exception-reason" className={labelBase}>
            Reason
          </label>
          <textarea
            id="exception-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Why this exception is needed and for how long"
            className={inputBase}
          />
        </div>

        <div>
          <label htmlFor="exception-compensating" className={labelBase}>
            Compensating measure{" "}
            <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
          </label>
          <textarea
            id="exception-compensating"
            value={compensating}
            onChange={(e) => setCompensating(e.target.value)}
            rows={2}
            placeholder="Mitigations that reduce the risk while the exception is in force"
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
            disabled={create.isPending}
            className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-4 py-2 text-xs font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {create.isPending ? <Loader2 size={13} className="animate-spin" /> : null}
            Request exception
          </button>
        </div>
      </form>
    </Modal>
  );
}
