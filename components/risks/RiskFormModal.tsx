"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldAlert, SquarePen } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";
import {
  RISK_CATEGORIES,
  RISK_SCALE,
  RISK_STATUSES,
  TREATMENT_STRATEGIES,
  type Risk,
  type RiskStatus,
  type RiskUpdatePayload,
  type TreatmentStrategy
} from "@/lib/api/risks";
import { ApiError } from "@/lib/api/client";
import { EntitlementBanner } from "@/components/common/EntitlementBanner";
import { useCreateRisk, useOrgUsers, useUpdateRisk } from "@/lib/hooks/useRisks";

const labelCls = "text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";
const inputCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-sm text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none";
const selectCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3 py-2.5 text-sm font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none";

function prettify(v: string) {
  return v.replaceAll("_", " ");
}

/** 1–5 segmented picker for likelihood / impact (schema: integer, min 1, max 5). */
function ScalePicker({
  value,
  onChange,
  ariaLabel
}: {
  value: number;
  onChange: (v: number) => void;
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex gap-1.5">
      {RISK_SCALE.map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          onClick={() => onChange(n)}
          className={cn(
            "cv-ring-focus flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold ring-1 transition",
            value === n
              ? "bg-cv-brand text-white ring-transparent shadow-tile"
              : "bg-white/55 text-cv-slate ring-white/70 hover:bg-white/85 hover:text-cv-ink"
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

type RiskFormModalProps = {
  open: boolean;
  onClose: () => void;
  /** When set the modal edits this risk (PATCH); otherwise it creates one (POST). */
  risk?: Risk | null;
};

/**
 * Create / edit form for risks. Field options mirror the live backend schema —
 * see the constants in lib/api/risks.ts for provenance. Backend validation
 * errors (422/400/403/503) are surfaced verbatim, never swallowed.
 */
export function RiskFormModal({ open, onClose, risk }: RiskFormModalProps) {
  const isEdit = Boolean(risk);
  const users = useOrgUsers();
  const createRisk = useCreateRisk();
  const updateRisk = useUpdateRisk();
  const mutation = isEdit ? updateRisk : createRisk;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("other");
  const [likelihood, setLikelihood] = useState(3);
  const [impact, setImpact] = useState(3);
  const [status, setStatus] = useState<RiskStatus>("identified");
  const [treatment, setTreatment] = useState<TreatmentStrategy>("undecided");
  const [ownerId, setOwnerId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Re-seed the form whenever the dialog opens (or the target risk changes).
  useEffect(() => {
    if (!open) return;
    setError(null);
    createRisk.reset();
    updateRisk.reset();
    setTitle(risk?.title ?? "");
    setDescription(risk?.description ?? "");
    setCategory(risk?.category ?? "other");
    setLikelihood(risk?.likelihood ?? 3);
    setImpact(risk?.impact ?? 3);
    setStatus((risk?.status as RiskStatus) ?? "identified");
    setTreatment((risk?.treatment_strategy as TreatmentStrategy) ?? "undecided");
    setOwnerId(risk?.owner_user_id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, risk?.id]);

  // Backend requires the owner to be an ACTIVE org member (400 otherwise).
  const activeUsers = useMemo(
    () => (users.data ?? []).filter((u) => u.is_active && u.status === "active"),
    [users.data]
  );

  // Keep a pre-existing category visible even if it is outside the offered set
  // (the backend also auto-generates categories like "ai" or "third_party").
  const categoryOptions = useMemo(() => {
    const base = [...RISK_CATEGORIES] as string[];
    if (risk?.category && !base.includes(risk.category)) base.unshift(risk.category);
    return base;
  }, [risk?.category]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isEdit && risk) {
        // PATCH is partial — send only the fields that actually changed.
        const patch: RiskUpdatePayload = {};
        if (title !== risk.title) patch.title = title;
        if (description !== (risk.description ?? "")) patch.description = description || null;
        if (category !== (risk.category ?? "other")) patch.category = category;
        if (status !== risk.status) patch.status = status;
        if (likelihood !== risk.likelihood) patch.likelihood = likelihood;
        if (impact !== risk.impact) patch.impact = impact;
        if (treatment !== (risk.treatment_strategy ?? "undecided")) patch.treatment_strategy = treatment;
        if ((ownerId || null) !== risk.owner_user_id) patch.owner_user_id = ownerId || null;
        if (Object.keys(patch).length === 0) {
          onClose();
          return;
        }
        await updateRisk.mutateAsync({ riskId: risk.id, payload: patch });
      } else {
        await createRisk.mutateAsync({
          title,
          description: description || null,
          category,
          likelihood,
          impact,
          treatment_strategy: treatment,
          owner_user_id: ownerId || null
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Request failed — the backend may be unavailable.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Risk" : "Register New Risk"}
      subtitle={isEdit ? risk?.title : "Score likelihood × impact on the 1–5 scale"}
      icon={isEdit ? SquarePen : ShieldAlert}
      accent="red"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="risk-title" className={labelCls}>
            Title
          </label>
          <input
            id="risk-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={3}
            maxLength={255}
            placeholder="e.g. Unencrypted backups in legacy storage"
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="risk-description" className={labelCls}>
            Description <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
          </label>
          <textarea
            id="risk-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Context, affected systems, potential consequences…"
            className={cn(inputCls, "resize-y")}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="risk-category" className={labelCls}>
              Category
            </label>
            <select id="risk-category" value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {prettify(c)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="risk-owner" className={labelCls}>
              Owner
            </label>
            <select id="risk-owner" value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className={selectCls}>
              <option value="">Unassigned</option>
              {activeUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email}
                </option>
              ))}
            </select>
            {users.isSuccess && activeUsers.length === 0 ? (
              <p className="text-[11px] text-cv-mist">No active members available to own this risk.</p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className={labelCls}>Likelihood (1–5)</span>
            <ScalePicker value={likelihood} onChange={setLikelihood} ariaLabel="Likelihood" />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={labelCls}>Impact (1–5)</span>
            <ScalePicker value={impact} onChange={setImpact} ariaLabel="Impact" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="risk-treatment" className={labelCls}>
              Treatment strategy
            </label>
            <select
              id="risk-treatment"
              value={treatment}
              onChange={(e) => setTreatment(e.target.value as TreatmentStrategy)}
              className={selectCls}
            >
              {TREATMENT_STRATEGIES.map((t) => (
                <option key={t} value={t}>
                  {prettify(t)}
                </option>
              ))}
            </select>
          </div>
          {isEdit ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="risk-status" className={labelCls}>
                Status
              </label>
              <select
                id="risk-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as RiskStatus)}
                className={selectCls}
              >
                {RISK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {prettify(s)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        {(() => {
          const mutErr = createRisk.error ?? updateRisk.error;
          if (mutErr instanceof ApiError) return <EntitlementBanner error={mutErr} />;
          return error ? (
            <p role="alert" className="rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">
              {error}
            </p>
          ) : null;
        })()}

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
            disabled={mutation.isPending}
            className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-5 py-2 text-[13px] font-semibold text-white shadow-tile transition hover:opacity-90 disabled:opacity-60"
          >
            {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            {isEdit ? "Save changes" : "Register risk"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
