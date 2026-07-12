"use client";

import { useEffect, useState } from "react";
import { ClipboardSignature, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";
import { getPolicies } from "@/lib/api/policies";
import { ApiError } from "@/lib/api/client";
import { useCreateAttestationCampaign } from "@/lib/hooks/useEmployeeCompliance";

const labelCls = "text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";
const inputCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-sm text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none";
const selectCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3 py-2.5 text-sm font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none";

/**
 * Launch a policy attestation campaign
 * (POST /api/v1/compliance/attestation-campaigns). The campaign must target a
 * real policy — options come from GET /api/v1/compliance/policies.
 */
export function AttestationCampaignModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateAttestationCampaign();
  const policies = useQuery({ queryKey: ["policies"], queryFn: getPolicies, enabled: open });

  const [policyId, setPolicyId] = useState("");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [attestationText, setAttestationText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    create.reset();
    setPolicyId("");
    setTitle("");
    setDueDate("");
    setDescription("");
    setAttestationText("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!policyId) {
      setError("Pick the policy this campaign attests to.");
      return;
    }
    try {
      await create.mutateAsync({
        policy_id: policyId,
        title: title.trim(),
        due_date: dueDate,
        description: description.trim() || null,
        attestation_text: attestationText.trim() || null
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
      title="Launch Attestation Campaign"
      subtitle="Collect policy acknowledgements from members"
      icon={ClipboardSignature}
      accent="purple"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="atc-policy" className={labelCls}>
            Policy
          </label>
          <select id="atc-policy" value={policyId} onChange={(e) => setPolicyId(e.target.value)} required className={selectCls}>
            <option value="">
              {policies.isLoading ? "Loading policies…" : policies.isError ? "Could not load policies" : "Select a policy…"}
            </option>
            {(policies.data ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.status})
              </option>
            ))}
          </select>
          {policies.isSuccess && policies.data.length === 0 ? (
            <p className="text-[11px] text-cv-mist">No policies exist yet — create one on the Policies page first.</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="atc-title" className={labelCls}>
              Campaign title
            </label>
            <input
              id="atc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={1}
              maxLength={200}
              placeholder="e.g. 2026 AI acceptable-use attestation"
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="atc-due" className={labelCls}>
              Due date
            </label>
            <input id="atc-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className={inputCls} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="atc-text" className={labelCls}>
            Attestation statement <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
          </label>
          <textarea
            id="atc-text"
            value={attestationText}
            onChange={(e) => setAttestationText(e.target.value)}
            rows={2}
            placeholder="e.g. I have read and will comply with this policy."
            className={cn(inputCls, "resize-y")}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="atc-desc" className={labelCls}>
            Description <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
          </label>
          <textarea
            id="atc-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Why this campaign is running and who it covers…"
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
            Launch campaign
          </button>
        </div>
      </form>
    </Modal>
  );
}
