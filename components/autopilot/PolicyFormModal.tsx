"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldPlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";
import {
  AUTOPILOT_POLICY_MODES,
  AUTOPILOT_PRIORITY_BANDS,
  type AutopilotPolicyMode,
  type PriorityBand
} from "@/lib/api/autopilot";
import { ApiError } from "@/lib/api/client";
import { useCreatePolicy } from "@/lib/hooks/useAutopilot";

const labelCls = "text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";
const inputCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-sm text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none";
const selectCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3 py-2.5 text-sm font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none";

function prettify(v: string) {
  return v.replaceAll("_", " ");
}

const MODE_HINTS: Record<AutopilotPolicyMode, string> = {
  disabled: "Autopilot fully off — every candidate action is blocked.",
  observe_only: "Autopilot observes signals but blocks all planned actions.",
  suggest_only: "Actions are planned as suggestions only (safe default).",
  draft_only: "Autopilot may prepare drafts but never applies them.",
  require_approval: "Every action needs explicit human approval.",
  execute_safe_later: "Low-risk allowed actions may auto-execute once the org opts in."
};

/** Capability grant toggles mirror the backend policy booleans (safe default: false). */
function GrantToggle({
  label,
  hint,
  checked,
  onChange
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "cv-ring-focus flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left ring-1 transition",
        checked ? "bg-amber-400/10 ring-amber-400/30" : "bg-white/50 ring-white/60 hover:bg-white/75"
      )}
    >
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold text-cv-ink">{label}</span>
        <span className="block text-[11px] text-cv-slate">{hint}</span>
      </span>
      <span
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition",
          checked ? "bg-amber-500" : "bg-slate-300/70"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all",
            checked ? "left-[18px]" : "left-0.5"
          )}
        />
      </span>
    </button>
  );
}

/**
 * Create form for autopilot guardrail policies —
 * POST /api/v1/ai-governance/autopilot/policies. Backend errors surface verbatim.
 */
export function PolicyFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createPolicy = useCreatePolicy();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<AutopilotPolicyMode>("suggest_only");
  const [maxBand, setMaxBand] = useState<PriorityBand>("low");
  const [isDefault, setIsDefault] = useState(false);
  const [taskCreation, setTaskCreation] = useState(false);
  const [reviewCreation, setReviewCreation] = useState(false);
  const [externalEffects, setExternalEffects] = useState(false);
  const [sourceMutation, setSourceMutation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    createPolicy.reset();
    setName("");
    setDescription("");
    setMode("suggest_only");
    setMaxBand("low");
    setIsDefault(false);
    setTaskCreation(false);
    setReviewCreation(false);
    setExternalEffects(false);
    setSourceMutation(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createPolicy.mutateAsync({
        name,
        description: description || null,
        mode,
        is_default: isDefault,
        max_allowed_priority_band_for_auto: maxBand,
        task_creation_allowed: taskCreation,
        review_creation_allowed: reviewCreation,
        external_effects_allowed: externalEffects,
        source_record_mutation_allowed: sourceMutation
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
      title="New Guardrail Policy"
      subtitle="Deterministic bounds on what autopilot may plan or execute"
      icon={ShieldPlus}
      accent="teal"
      widthClassName="max-w-xl"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pol-name" className={labelCls}>
            Name
          </label>
          <input
            id="pol-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={255}
            placeholder="e.g. Suggest-only baseline"
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="pol-desc" className={labelCls}>
            Description <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
          </label>
          <textarea
            id="pol-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What this policy bounds and why…"
            className={cn(inputCls, "resize-y")}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pol-mode" className={labelCls}>
              Mode
            </label>
            <select
              id="pol-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as AutopilotPolicyMode)}
              className={selectCls}
            >
              {AUTOPILOT_POLICY_MODES.map((m) => (
                <option key={m} value={m}>
                  {prettify(m)}
                </option>
              ))}
            </select>
            <p className="text-[11px] leading-snug text-cv-mist">{MODE_HINTS[mode]}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pol-band" className={labelCls}>
              Max auto priority band
            </label>
            <select
              id="pol-band"
              value={maxBand}
              onChange={(e) => setMaxBand(e.target.value as PriorityBand)}
              className={selectCls}
            >
              {AUTOPILOT_PRIORITY_BANDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <p className="text-[11px] leading-snug text-cv-mist">
              Actions above this band always require human approval.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className={labelCls}>Capability grants</span>
          <GrantToggle
            label="Task creation"
            hint="Allow autopilot to create internal follow-up tasks"
            checked={taskCreation}
            onChange={setTaskCreation}
          />
          <GrantToggle
            label="Review creation"
            hint="Allow autopilot to open review records"
            checked={reviewCreation}
            onChange={setReviewCreation}
          />
          <GrantToggle
            label="Source record mutation"
            hint="Allow autopilot to modify governance source records"
            checked={sourceMutation}
            onChange={setSourceMutation}
          />
          <GrantToggle
            label="External effects"
            hint="Allow actions with effects outside CompliVibe"
            checked={externalEffects}
            onChange={setExternalEffects}
          />
        </div>

        <label className="flex items-center gap-2.5 text-[13px] font-semibold text-cv-ink">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="cv-ring-focus h-4 w-4 rounded accent-cv-blue"
          />
          Make this the organization default policy
        </label>

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
            disabled={createPolicy.isPending}
            className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-5 py-2 text-[13px] font-semibold text-white shadow-tile transition hover:opacity-90 disabled:opacity-60"
          >
            {createPolicy.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            Create policy
          </button>
        </div>
      </form>
    </Modal>
  );
}
