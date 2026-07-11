"use client";

import { useEffect, useState } from "react";
import { Loader2, Scale } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";
import { LEGAL_MATTER_TYPES, type LegalMatterType } from "@/lib/api/legal";
import { ApiError } from "@/lib/api/client";
import { useCreateLegalMatter } from "@/lib/hooks/useLegal";

const labelCls = "text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";
const inputCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-sm text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none";
const selectCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3 py-2.5 text-sm font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none";

/**
 * Create form for legal matters (POST /api/v1/legal-matters). Matter types
 * mirror the LegalMatterCreate schema pattern; backend errors surface verbatim.
 */
export function LegalMatterFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateLegalMatter();

  const [title, setTitle] = useState("");
  const [matterType, setMatterType] = useState<LegalMatterType>("other");
  const [description, setDescription] = useState("");
  const [opposingParty, setOpposingParty] = useState("");
  const [outsideCounsel, setOutsideCounsel] = useState("");
  const [budget, setBudget] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    create.reset();
    setTitle("");
    setMatterType("other");
    setDescription("");
    setOpposingParty("");
    setOutsideCounsel("");
    setBudget("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const budgetNum = budget.trim() === "" ? null : Number(budget);
    if (budgetNum != null && (!Number.isFinite(budgetNum) || budgetNum < 0)) {
      setError("Budget must be a non-negative number.");
      return;
    }
    try {
      await create.mutateAsync({
        title: title.trim(),
        matter_type: matterType,
        description: description.trim() || null,
        opposing_party: opposingParty.trim() || null,
        outside_counsel: outsideCounsel.trim() || null,
        budget: budgetNum
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
      title="Open Legal Matter"
      subtitle="Track litigation, counsel, and budget"
      icon={Scale}
      accent="blue"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lm-title" className={labelCls}>
            Title
          </label>
          <input
            id="lm-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={1}
            maxLength={255}
            placeholder="e.g. Vendor contract dispute — Acme SaaS"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lm-type" className={labelCls}>
              Matter type
            </label>
            <select
              id="lm-type"
              value={matterType}
              onChange={(e) => setMatterType(e.target.value as LegalMatterType)}
              className={selectCls}
            >
              {LEGAL_MATTER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lm-budget" className={labelCls}>
              Budget (₹) <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <input
              id="lm-budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              inputMode="decimal"
              placeholder="e.g. 250000"
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lm-opposing" className={labelCls}>
              Opposing party <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <input
              id="lm-opposing"
              value={opposingParty}
              onChange={(e) => setOpposingParty(e.target.value)}
              placeholder="e.g. Acme Corp"
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lm-counsel" className={labelCls}>
              Outside counsel <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <input
              id="lm-counsel"
              value={outsideCounsel}
              onChange={(e) => setOutsideCounsel(e.target.value)}
              placeholder="e.g. Khaitan & Co"
              className={inputCls}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="lm-desc" className={labelCls}>
            Description <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
          </label>
          <textarea
            id="lm-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Background, exposure, current posture…"
            className={cn(inputCls, "resize-y")}
          />
        </div>

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
            disabled={create.isPending}
            className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-5 py-2 text-[13px] font-semibold text-white shadow-tile transition hover:opacity-90 disabled:opacity-60"
          >
            {create.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            Open matter
          </button>
        </div>
      </form>
    </Modal>
  );
}
