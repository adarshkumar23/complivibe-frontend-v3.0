"use client";

import { useEffect, useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";
import type { BusinessUnit } from "@/lib/api/enterprise";
import { ApiError } from "@/lib/api/client";
import { useCreateBusinessUnit } from "@/lib/hooks/useEnterpriseControl";

const labelCls = "text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";
const inputCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-sm text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none";
const selectCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3 py-2.5 text-sm font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none";

/**
 * Create a business unit (POST /api/v1/compliance/business-units). Parent
 * options are the org's real existing business units.
 */
export function BusinessUnitFormModal({
  open,
  onClose,
  businessUnits
}: {
  open: boolean;
  onClose: () => void;
  businessUnits: BusinessUnit[];
}) {
  const create = useCreateBusinessUnit();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [parentId, setParentId] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    create.reset();
    setName("");
    setCode("");
    setParentId("");
    setDescription("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await create.mutateAsync({
        name: name.trim(),
        code: code.trim(),
        parent_bu_id: parentId || null,
        description: description.trim() || null
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
      title="Create Business Unit"
      subtitle="Organizational scope for controls and reporting"
      icon={Building2}
      accent="blue"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bu-name" className={labelCls}>
              Name
            </label>
            <input
              id="bu-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. India Engineering"
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bu-code" className={labelCls}>
              Code
            </label>
            <input
              id="bu-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              placeholder="e.g. IN-ENG"
              className={inputCls}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="bu-parent" className={labelCls}>
            Parent unit <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
          </label>
          <select id="bu-parent" value={parentId} onChange={(e) => setParentId(e.target.value)} className={selectCls}>
            <option value="">None — top level</option>
            {businessUnits.map((b) => (
              <option key={b.id} value={b.id}>
                {(b.name as string) ?? b.id}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="bu-desc" className={labelCls}>
            Description <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
          </label>
          <textarea
            id="bu-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Scope, geography, cost center context…"
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
            Create unit
          </button>
        </div>
      </form>
    </Modal>
  );
}
