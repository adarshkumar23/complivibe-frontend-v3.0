"use client";

import { useState } from "react";
import { Loader2, ShieldPlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { EntitlementBanner } from "@/components/common/EntitlementBanner";
import {
  CONTROL_TYPES,
  CONTROL_CRITICALITIES,
  type Control,
  type ControlCreateInput
} from "@/lib/api/controls";
import { useCreateControl } from "@/lib/hooks/useControls";

const inputBase =
  "w-full rounded-2xl bg-white/65 px-3.5 py-2.5 text-sm text-cv-ink placeholder:text-cv-mist ring-1 ring-white/70 transition focus:outline-none focus:ring-2 focus:ring-cv-blue/45";

const labelBase = "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";

function prettify(v: string) {
  return v.replaceAll("_", " ");
}

/** Create form for POST /api/v1/controls. */
export function ControlCreateModal({
  open,
  onClose,
  onCreated
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (control: Control) => void;
}) {
  const create = useCreateControl();

  const [title, setTitle] = useState("");
  const [controlCode, setControlCode] = useState("");
  const [controlType, setControlType] = useState<(typeof CONTROL_TYPES)[number]>("technical");
  const [criticality, setCriticality] = useState<(typeof CONTROL_CRITICALITIES)[number]>("medium");
  const [description, setDescription] = useState("");
  const [testingProcedure, setTestingProcedure] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const err = create.error instanceof ApiError ? create.error : null;

  function resetAndClose() {
    setTitle("");
    setControlCode("");
    setControlType("technical");
    setCriticality("medium");
    setDescription("");
    setTestingProcedure("");
    setFormError(null);
    create.reset();
    onClose();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (title.trim().length < 3) {
      setFormError("Give the control a title (at least 3 characters).");
      return;
    }
    const body: ControlCreateInput = {
      title: title.trim(),
      control_code: controlCode.trim() || null,
      control_type: controlType,
      criticality,
      description: description.trim() || null,
      testing_procedure: testingProcedure.trim() || null
    };
    try {
      const created = await create.mutateAsync(body);
      onCreated?.(created);
      resetAndClose();
    } catch {
      // error surfaced below via create.error
    }
  }

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title="New Control"
      subtitle="Add a control to the organization's register"
      icon={ShieldPlus}
      accent="blue"
      widthClassName="max-w-xl"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="control-title" className={labelBase}>
              Title
            </label>
            <input
              id="control-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              placeholder="e.g. Encrypt personal data in transit (TLS 1.2+)"
              className={inputBase}
            />
          </div>

          <div>
            <label htmlFor="control-code" className={labelBase}>
              Control code <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <input
              id="control-code"
              value={controlCode}
              onChange={(e) => setControlCode(e.target.value)}
              maxLength={120}
              placeholder="e.g. SEC-014"
              className={inputBase}
            />
          </div>

          <div>
            <label htmlFor="control-type" className={labelBase}>
              Control type
            </label>
            <select
              id="control-type"
              value={controlType}
              onChange={(e) => setControlType(e.target.value as (typeof CONTROL_TYPES)[number])}
              className={inputBase}
            >
              {CONTROL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {prettify(t)}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="control-criticality" className={labelBase}>
              Criticality
            </label>
            <select
              id="control-criticality"
              value={criticality}
              onChange={(e) => setCriticality(e.target.value as (typeof CONTROL_CRITICALITIES)[number])}
              className={inputBase}
            >
              {CONTROL_CRITICALITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="control-description" className={labelBase}>
              Description <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <textarea
              id="control-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What this control does and where it applies"
              className={inputBase}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="control-testing" className={labelBase}>
              Testing procedure <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <textarea
              id="control-testing"
              value={testingProcedure}
              onChange={(e) => setTestingProcedure(e.target.value)}
              rows={2}
              placeholder="How operation of this control is verified"
              className={inputBase}
            />
          </div>
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
            Create control
          </button>
        </div>
      </form>
    </Modal>
  );
}
