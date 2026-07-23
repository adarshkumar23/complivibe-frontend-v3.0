"use client";

import { useState } from "react";
import { Loader2, FileDown } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { EntitlementBanner } from "@/components/common/EntitlementBanner";
import { SIMPLE_EXPORT_TYPES, type ExportCreatePayload } from "@/lib/api/exports";
import { useCreateExportJob } from "@/lib/hooks/useExports";

const inputBase =
  "w-full rounded-2xl bg-white/65 px-3.5 py-2.5 text-sm text-cv-ink placeholder:text-cv-mist ring-1 ring-white/70 transition focus:outline-none focus:ring-2 focus:ring-cv-blue/45";

const labelBase = "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";

function prettify(v: string) {
  return v.replace(/_json$/, "").replaceAll("_", " ");
}

/**
 * Create form for POST /api/v1/exports/jobs. Only dependency-free JSON export types
 * (SIMPLE_EXPORT_TYPES) are offered so no extra source/framework id is required.
 */
export function CreateExportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateExportJob();

  const [exportType, setExportType] = useState<string>(SIMPLE_EXPORT_TYPES[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [validityDays, setValidityDays] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const err = create.error instanceof ApiError ? create.error : null;

  function resetAndClose() {
    setExportType(SIMPLE_EXPORT_TYPES[0]);
    setTitle("");
    setDescription("");
    setValidityDays("");
    setFormError(null);
    create.reset();
    onClose();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    let validity: number | undefined;
    if (validityDays.trim()) {
      const parsed = Number(validityDays);
      if (!Number.isInteger(parsed) || parsed < 1) {
        setFormError("Validity must be a whole number of days (at least 1).");
        return;
      }
      validity = parsed;
    }

    const body: ExportCreatePayload = {
      export_type: exportType,
      title: title.trim() || null,
      description: description.trim() || null,
      ...(validity != null ? { validity_days: validity } : {})
    };

    try {
      await create.mutateAsync(body);
      resetAndClose();
    } catch {
      // error surfaced below via create.error
    }
  }

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title="New export"
      subtitle="Generate a signed, integrity-bound export package"
      icon={FileDown}
      accent="blue"
      widthClassName="max-w-xl"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="export-type" className={labelBase}>
              Export type
            </label>
            <select
              id="export-type"
              value={exportType}
              onChange={(e) => setExportType(e.target.value)}
              className={inputBase}
            >
              {SIMPLE_EXPORT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {prettify(t)}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="export-title" className={labelBase}>
              Title <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <input
              id="export-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              placeholder="e.g. Q3 executive summary for the board"
              className={inputBase}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="export-description" className={labelBase}>
              Description <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <textarea
              id="export-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What this export is for and who will consume it"
              className={inputBase}
            />
          </div>

          <div>
            <label htmlFor="export-validity" className={labelBase}>
              Validity (days){" "}
              <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <input
              id="export-validity"
              type="number"
              min={1}
              step={1}
              value={validityDays}
              onChange={(e) => setValidityDays(e.target.value)}
              placeholder="e.g. 30"
              className={inputBase}
            />
            <p className="mt-1 text-[11px] leading-relaxed text-cv-slate">
              Sets the export&apos;s validity window; after it lapses the package verifies as expired.
            </p>
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
            Create export
          </button>
        </div>
      </form>
    </Modal>
  );
}
