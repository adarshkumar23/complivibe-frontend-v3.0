"use client";

import { useMemo, useState } from "react";
import { FilePlus2, Loader2, Paperclip, ShieldAlert, Upload, Link as LinkIcon } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { EVIDENCE_ALLOWED_EXTENSIONS, EVIDENCE_MAX_UPLOAD_BYTES, type Evidence } from "@/lib/api/evidence";
import { useCreateEvidence, useUploadEvidenceFile, useLinkEvidenceControl } from "@/lib/hooks/useEvidence";
import { useControls } from "@/lib/hooks/useControls";

const inputBase =
  "w-full rounded-2xl bg-white/65 px-3.5 py-2.5 text-sm text-cv-ink placeholder:text-cv-mist ring-1 ring-white/70 transition focus:outline-none focus:ring-2 focus:ring-cv-blue/45";
const labelBase = "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";

const EVIDENCE_TYPES = ["document", "policy", "screenshot", "report", "log", "certificate", "other"] as const;

function fileExt(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

/**
 * Create evidence: metadata → (optional) real file upload OR external URL →
 * (optional) link to controls. POST /api/v1/evidence, then POST /{id}/file and
 * POST /{id}/controls. Gated at the call site by evidence:write.
 */
export function EvidenceCreateModal({
  open,
  onClose,
  onCreated,
  presetControlId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (ev: Evidence) => void;
  presetControlId?: string;
}) {
  const create = useCreateEvidence();
  const upload = useUploadEvidenceFile();
  const link = useLinkEvidenceControl();
  const controls = useControls();
  const controlList = useMemo(() => controls.controls.data ?? [], [controls.controls.data]);
  const presetControl = presetControlId ? controlList.find((c) => c.id === presetControlId) : undefined;

  const [title, setTitle] = useState("");
  const [evidenceType, setEvidenceType] = useState<(typeof EVIDENCE_TYPES)[number]>("document");
  const [description, setDescription] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [attachMode, setAttachMode] = useState<"file" | "url">("file");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const err = [upload.error, create.error, link.error].find((e) => e instanceof ApiError) as ApiError | undefined;
  const featureGated = err?.status === 403;
  const busy = create.isPending || uploading || link.isPending;

  function resetAndClose() {
    setTitle("");
    setEvidenceType("document");
    setDescription("");
    setValidFrom("");
    setValidUntil("");
    setAttachMode("file");
    setFile(null);
    setUrl("");
    setSelected(new Set());
    setFormError(null);
    setUploading(false);
    create.reset();
    upload.reset();
    link.reset();
    onClose();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormError(null);
    const f = e.target.files?.[0] ?? null;
    if (f) {
      const ext = fileExt(f.name);
      if (!EVIDENCE_ALLOWED_EXTENSIONS.includes(ext as (typeof EVIDENCE_ALLOWED_EXTENSIONS)[number])) {
        setFormError(`File type "${ext || "(none)"}" is not allowed. Permitted: ${EVIDENCE_ALLOWED_EXTENSIONS.join(", ")}.`);
        setFile(null);
        return;
      }
      if (f.size > EVIDENCE_MAX_UPLOAD_BYTES) {
        setFormError(`File is too large (${(f.size / 1_048_576).toFixed(1)} MB). Maximum is ${(EVIDENCE_MAX_UPLOAD_BYTES / 1_048_576).toFixed(0)} MB.`);
        setFile(null);
        return;
      }
    }
    setFile(f);
  }

  function toggleControl(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (title.trim().length < 3) {
      setFormError("Give the evidence a title (at least 3 characters).");
      return;
    }
    if (attachMode === "url" && !url.trim()) {
      setFormError("Enter the external reference URL, or switch to file upload.");
      return;
    }
    try {
      const created = await create.mutateAsync({
        title: title.trim(),
        evidence_type: evidenceType,
        description: description.trim() || null,
        external_reference_url: attachMode === "url" ? url.trim() || null : null,
        valid_from: validFrom || null,
        valid_until: validUntil || null,
      });

      if (attachMode === "file" && file) {
        setUploading(true);
        try {
          await upload.mutateAsync({ evidenceId: created.id, file });
        } finally {
          setUploading(false);
        }
      }

      const controlIds = presetControlId ? [presetControlId] : [...selected];
      for (const controlId of controlIds) {
        await link.mutateAsync({ evidenceId: created.id, controlId });
      }

      onCreated?.(created);
      resetAndClose();
    } catch {
      // surfaced below via err
    }
  }

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title="New Evidence"
      subtitle="Record evidence metadata, attach a file or URL, and link controls"
      icon={FilePlus2}
      accent="green"
      widthClassName="max-w-xl"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="evidence-title" className={labelBase}>Title</label>
            <input
              id="evidence-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              placeholder="e.g. SOC 2 Type II report FY2026"
              className={inputBase}
            />
          </div>
          <div>
            <label htmlFor="evidence-type" className={labelBase}>Evidence type</label>
            <select id="evidence-type" value={evidenceType} onChange={(e) => setEvidenceType(e.target.value as (typeof EVIDENCE_TYPES)[number])} className={inputBase}>
              {EVIDENCE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="evidence-valid-from" className={labelBase}>Valid from</label>
              <input id="evidence-valid-from" type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className={inputBase} />
            </div>
            <div>
              <label htmlFor="evidence-valid-until" className={labelBase}>Valid until</label>
              <input id="evidence-valid-until" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={inputBase} />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="evidence-desc" className={labelBase}>
              Description <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <textarea id="evidence-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What this evidence demonstrates" className={inputBase} />
          </div>
        </div>

        {/* Attachment: real file upload OR external URL */}
        <div className="rounded-2xl bg-white/45 p-3.5 ring-1 ring-white/60">
          <div className="mb-2.5 flex items-center gap-1.5">
            <button
              type="button"
              data-testid="mode-file"
              onClick={() => setAttachMode("file")}
              className={`cv-ring-focus inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ring-1 transition ${attachMode === "file" ? "bg-cv-brand text-white ring-transparent" : "bg-white/70 text-cv-ink ring-white/70 hover:bg-white"}`}
            >
              <Upload size={11} strokeWidth={2.6} /> Upload file
            </button>
            <button
              type="button"
              data-testid="mode-url"
              onClick={() => setAttachMode("url")}
              className={`cv-ring-focus inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ring-1 transition ${attachMode === "url" ? "bg-cv-brand text-white ring-transparent" : "bg-white/70 text-cv-ink ring-white/70 hover:bg-white"}`}
            >
              <LinkIcon size={11} strokeWidth={2.6} /> External URL
            </button>
          </div>
          {attachMode === "file" ? (
            <div>
              <input
                id="evidence-file"
                type="file"
                accept={EVIDENCE_ALLOWED_EXTENSIONS.join(",")}
                onChange={onFileChange}
                className="block w-full text-[12px] text-cv-slate file:mr-3 file:rounded-full file:border-0 file:bg-cv-brand-soft file:px-3.5 file:py-1.5 file:text-[11px] file:font-semibold file:text-cv-blue hover:file:bg-cv-brand-soft/80"
              />
              {file ? (
                <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-cv-slate">
                  <Paperclip size={11} className="shrink-0" />
                  <span className="truncate">{file.name}</span> · {(file.size / 1024).toFixed(0)} KB
                </p>
              ) : (
                <p className="mt-1.5 text-[11px] text-cv-mist">Optional — max 25 MB. Permitted: PDF, images, Office docs, txt/csv/json/xml.</p>
              )}
            </div>
          ) : (
            <div>
              <input id="evidence-url" value={url} onChange={(e) => setUrl(e.target.value)} maxLength={1024} placeholder="https://…" className={inputBase} />
              <p className="mt-1.5 text-[11px] text-cv-mist">Link to evidence hosted elsewhere (e.g. a shared drive).</p>
            </div>
          )}
        </div>

        {/* Optional control links */}
        <div>
          <span className={labelBase}>
            {presetControl ? "Linked control" : "Link to controls"}{" "}
            <span className="font-medium normal-case tracking-normal text-cv-mist">{presetControl ? "" : "(optional)"}</span>
          </span>
          {presetControl ? (
            <div className="rounded-2xl bg-blue-500/10 px-3.5 py-2.5 ring-1 ring-blue-400/30">
              <p className="text-[13px] font-semibold text-cv-ink">
                {presetControl.control_code ? <span className="mr-1.5 text-cv-blue">{presetControl.control_code}</span> : null}
                {presetControl.title}
              </p>
            </div>
          ) : presetControlId ? (
            <div className="rounded-2xl bg-blue-500/10 px-3.5 py-2.5 text-[13px] font-semibold text-cv-ink ring-1 ring-blue-400/30">This control</div>
          ) : (
            <div className="max-h-36 overflow-y-auto rounded-2xl bg-white/45 p-2 ring-1 ring-white/60">
              {controls.controls.isLoading ? (
                <p className="px-1.5 py-1 text-[11px] text-cv-mist">Loading controls…</p>
              ) : controlList.length === 0 ? (
                <p className="px-1.5 py-1 text-[11px] text-cv-mist">No controls exist yet.</p>
              ) : (
                controlList.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-xl px-1.5 py-1 hover:bg-white/60">
                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleControl(c.id)} className="h-3.5 w-3.5 rounded" />
                    <span className="truncate text-[12px] text-cv-ink">
                      {c.control_code ? <span className="mr-1 text-cv-blue">{c.control_code}</span> : null}
                      {c.title}
                    </span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        {uploading ? (
          <p className="inline-flex items-center gap-2 rounded-2xl bg-blue-500/10 px-3.5 py-2.5 text-xs font-semibold text-cv-blue ring-1 ring-blue-400/25">
            <Loader2 size={13} className="animate-spin" /> Uploading file…
          </p>
        ) : null}
        {formError ? (
          <p className="rounded-2xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">{formError}</p>
        ) : null}
        {err ? (
          featureGated ? (
            <div className="flex items-start gap-2.5 rounded-2xl bg-amber-500/10 px-3.5 py-2.5 ring-1 ring-amber-400/25">
              <ShieldAlert size={15} className="mt-0.5 shrink-0 text-amber-600" />
              <p className="text-xs leading-relaxed text-amber-700"><span className="font-bold">Plan upgrade required.</span> {err.message}</p>
            </div>
          ) : (
            <p className="rounded-2xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">{err.message}</p>
          )
        ) : null}

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button type="button" onClick={resetAndClose} className="cv-ring-focus rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white">
            Cancel
          </button>
          <button
            type="submit"
            data-testid="evidence-submit"
            disabled={busy}
            className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-4 py-2 text-xs font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : null}
            Create evidence
          </button>
        </div>
      </form>
    </Modal>
  );
}
