"use client";

import { useEffect, useState } from "react";
import { Loader2, ListChecks } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { EntitlementBanner } from "@/components/common/EntitlementBanner";
import {
  useUpdateObligationState,
  OBLIGATION_APPLICABILITY_STATUSES,
  OBLIGATION_IMPLEMENTATION_STATUSES
} from "@/lib/hooks/useRegulatory";

const inputBase =
  "w-full rounded-2xl bg-white/65 px-3.5 py-2.5 text-sm text-cv-ink placeholder:text-cv-mist ring-1 ring-white/70 transition focus:outline-none focus:ring-2 focus:ring-cv-blue/45";
const labelBase = "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";

function prettify(v: string) {
  return v.replaceAll("_", " ");
}

export type DecisionObligation = {
  id: string;
  title: string;
  reference_code?: string | null;
  applicability_status?: string | null;
  implementation_status?: string | null;
};

/** Set the org's applicability/implementation decision for an obligation.
 * PATCH /api/v1/obligations/{id}/state. Gated at the call site on frameworks:activate. */
export function ObligationDecisionModal({ obligation, onClose }: { obligation: DecisionObligation | null; onClose: () => void }) {
  const update = useUpdateObligationState();
  const [applicability, setApplicability] = useState<string>("applicable");
  const [implementation, setImplementation] = useState<string>("not_started");
  const [justification, setJustification] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!obligation) return;
    setApplicability(obligation.applicability_status && obligation.applicability_status !== "unknown" ? obligation.applicability_status : "applicable");
    setImplementation(obligation.implementation_status ?? "not_started");
    setJustification("");
    setFormError(null);
    update.reset();
  }, [obligation]); // eslint-disable-line react-hooks/exhaustive-deps

  const err = update.error instanceof ApiError ? update.error : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!obligation) return;
    setFormError(null);
    // Backend requires BOTH applicability_status and implementation_status. When the
    // obligation doesn't apply, implementation is moot -> send not_started.
    const body: { applicability_status: string; implementation_status: string; justification?: string } = {
      applicability_status: applicability,
      implementation_status: applicability === "applicable" ? implementation : "not_started",
      justification: justification.trim() || undefined
    };
    try {
      await update.mutateAsync({ obligationId: obligation.id, body });
      onClose();
    } catch {
      // surfaced via err
    }
  }

  return (
    <Modal
      open={obligation != null}
      onClose={onClose}
      title="Decide applicability"
      subtitle={obligation ? `${obligation.reference_code ? obligation.reference_code + " · " : ""}${obligation.title}` : ""}
      icon={ListChecks}
      accent="blue"
      widthClassName="max-w-lg"
    >
      <form onSubmit={onSubmit} className="space-y-4" data-testid="obligation-decision-form">
        <div>
          <label htmlFor="obl-applicability" className={labelBase}>Applicability</label>
          <select id="obl-applicability" value={applicability} onChange={(e) => setApplicability(e.target.value)} className={inputBase}>
            {OBLIGATION_APPLICABILITY_STATUSES.map((s) => (
              <option key={s} value={s}>{prettify(s)}</option>
            ))}
          </select>
        </div>
        {applicability === "applicable" ? (
          <div>
            <label htmlFor="obl-implementation" className={labelBase}>Implementation status</label>
            <select id="obl-implementation" value={implementation} onChange={(e) => setImplementation(e.target.value)} className={inputBase}>
              {OBLIGATION_IMPLEMENTATION_STATUSES.map((s) => (
                <option key={s} value={s}>{prettify(s)}</option>
              ))}
            </select>
          </div>
        ) : null}
        <div>
          <label htmlFor="obl-justification" className={labelBase}>
            Justification <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
          </label>
          <textarea id="obl-justification" value={justification} onChange={(e) => setJustification(e.target.value)} rows={2} placeholder="Why this decision? (e.g. not applicable — no card payments)" className={inputBase} />
        </div>

        {formError ? (
          <p className="rounded-2xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">{formError}</p>
        ) : null}
        <EntitlementBanner error={err} />

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button type="button" onClick={onClose} className="cv-ring-focus rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white">
            Cancel
          </button>
          <button
            type="submit"
            data-testid="obligation-decision-submit"
            disabled={update.isPending}
            className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-4 py-2 text-xs font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {update.isPending ? <Loader2 size={13} className="animate-spin" /> : null}
            Save decision
          </button>
        </div>
      </form>
    </Modal>
  );
}
