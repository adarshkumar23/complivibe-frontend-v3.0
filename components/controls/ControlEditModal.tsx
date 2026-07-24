"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { EntitlementBanner } from "@/components/common/EntitlementBanner";
import { CONTROL_CRITICALITIES, CONTROL_STATUSES, type Control, type ControlUpdateInput } from "@/lib/api/controls";
import { useUpdateControl } from "@/lib/hooks/useControls";

const inputBase =
  "w-full rounded-2xl bg-white/65 px-3.5 py-2.5 text-sm text-cv-ink placeholder:text-cv-mist ring-1 ring-white/70 transition focus:outline-none focus:ring-2 focus:ring-cv-blue/45";
const labelBase = "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";

function prettify(v: string) {
  return v.replaceAll("_", " ");
}

/** Edit an existing control — PATCH /api/v1/controls/{id}. Gated at the call site
 * on controls:write (the backend enforces the same). */
export function ControlEditModal({ control, onClose }: { control: Control | null; onClose: () => void }) {
  const update = useUpdateControl();

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<(typeof CONTROL_STATUSES)[number]>("not_started");
  const [criticality, setCriticality] = useState<(typeof CONTROL_CRITICALITIES)[number]>("medium");
  const [description, setDescription] = useState("");
  const [testingProcedure, setTestingProcedure] = useState("");
  const [implementationNotes, setImplementationNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Re-seed from the control each time a control is opened for editing.
  useEffect(() => {
    if (!control) return;
    setTitle(control.title ?? "");
    setStatus((CONTROL_STATUSES as readonly string[]).includes(control.status) ? (control.status as (typeof CONTROL_STATUSES)[number]) : "not_started");
    setCriticality((CONTROL_CRITICALITIES as readonly string[]).includes(control.criticality ?? "") ? (control.criticality as (typeof CONTROL_CRITICALITIES)[number]) : "medium");
    setDescription(control.description ?? "");
    setTestingProcedure(control.testing_procedure ?? "");
    setImplementationNotes(control.implementation_notes ?? "");
    setFormError(null);
    update.reset();
  }, [control]); // eslint-disable-line react-hooks/exhaustive-deps

  const err = update.error instanceof ApiError ? update.error : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!control) return;
    setFormError(null);
    if (title.trim().length < 3) {
      setFormError("Give the control a title (at least 3 characters).");
      return;
    }
    const body: ControlUpdateInput = {
      title: title.trim(),
      status,
      criticality,
      description: description.trim() || null,
      testing_procedure: testingProcedure.trim() || null,
      implementation_notes: implementationNotes.trim() || null
    };
    try {
      await update.mutateAsync({ controlId: control.id, body });
      onClose();
    } catch {
      // surfaced via err
    }
  }

  return (
    <Modal
      open={control != null}
      onClose={onClose}
      title="Edit Control"
      subtitle="Update this control's details and status"
      icon={Pencil}
      accent="blue"
      widthClassName="max-w-xl"
    >
      <form onSubmit={onSubmit} className="space-y-4" data-testid="control-edit-form">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="control-edit-title" className={labelBase}>Title</label>
            <input id="control-edit-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} className={inputBase} />
          </div>
          <div>
            <label htmlFor="control-edit-status" className={labelBase}>Status</label>
            <select id="control-edit-status" value={status} onChange={(e) => setStatus(e.target.value as (typeof CONTROL_STATUSES)[number])} className={inputBase}>
              {CONTROL_STATUSES.map((s) => (
                <option key={s} value={s}>{prettify(s)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="control-edit-criticality" className={labelBase}>Criticality</label>
            <select id="control-edit-criticality" value={criticality} onChange={(e) => setCriticality(e.target.value as (typeof CONTROL_CRITICALITIES)[number])} className={inputBase}>
              {CONTROL_CRITICALITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="control-edit-description" className={labelBase}>Description</label>
            <textarea id="control-edit-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputBase} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="control-edit-testing" className={labelBase}>Testing procedure</label>
            <textarea id="control-edit-testing" value={testingProcedure} onChange={(e) => setTestingProcedure(e.target.value)} rows={2} className={inputBase} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="control-edit-notes" className={labelBase}>Implementation notes</label>
            <textarea id="control-edit-notes" value={implementationNotes} onChange={(e) => setImplementationNotes(e.target.value)} rows={2} className={inputBase} />
          </div>
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
            data-testid="control-edit-submit"
            disabled={update.isPending}
            className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-4 py-2 text-xs font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {update.isPending ? <Loader2 size={13} className="animate-spin" /> : null}
            Save changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
