"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";
import { ApiError } from "@/lib/api/client";
import { useCreateAccessCertCampaign } from "@/lib/hooks/useEnterpriseControl";

const labelCls = "text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";
const inputCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-sm text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none";
const selectCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3 py-2.5 text-sm font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none";

/**
 * Create an access certification campaign
 * (POST /api/v1/access-certifications/campaigns). New campaigns start as
 * draft or active per the schema's allowed create statuses.
 */
export function AccessCertCampaignModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateAccessCertCampaign();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<"draft" | "active">("draft");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    create.reset();
    setName("");
    setDescription("");
    setDueDate("");
    setStatus("draft");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await create.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        due_date: dueDate || null,
        status
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
      title="New Access Certification"
      subtitle="Periodic review of who should retain access"
      icon={BadgeCheck}
      accent="purple"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ac-name" className={labelCls}>
            Campaign name
          </label>
          <input
            id="ac-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={3}
            maxLength={255}
            placeholder="e.g. Q3 2026 production access review"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ac-due" className={labelCls}>
              Due date <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <input id="ac-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ac-status" className={labelCls}>
              Initial status
            </label>
            <select id="ac-status" value={status} onChange={(e) => setStatus(e.target.value as "draft" | "active")} className={selectCls}>
              <option value="draft">draft</option>
              <option value="active">active</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="ac-desc" className={labelCls}>
            Description <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
          </label>
          <textarea
            id="ac-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Which systems and roles this review covers…"
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
            Create campaign
          </button>
        </div>
      </form>
    </Modal>
  );
}
