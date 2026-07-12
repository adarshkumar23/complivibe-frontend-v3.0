"use client";

import { useEffect, useMemo, useState } from "react";
import { KeySquare, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";
import { NHI_RISK_LEVELS, NHI_TYPES, type NhiRiskLevel, type NhiType } from "@/lib/api/security";
import { getOrgUsers } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";
import { useCreateNhi } from "@/lib/hooks/useSecurity";

const labelCls = "text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";
const inputCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-sm text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none";
const selectCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3 py-2.5 text-sm font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none";

/**
 * Register a non-human identity (POST /api/v1/non-human-identities). The owner
 * must be a real org member — options come from GET /api/v1/users.
 */
export function NhiFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateNhi();
  const users = useQuery({ queryKey: ["org-users"], queryFn: () => getOrgUsers() });

  const [name, setName] = useState("");
  const [identityType, setIdentityType] = useState<NhiType>("service_account");
  const [ownerId, setOwnerId] = useState("");
  const [environment, setEnvironment] = useState("");
  const [riskLevel, setRiskLevel] = useState<NhiRiskLevel>("low");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const activeUsers = useMemo(() => (users.data ?? []).filter((u) => u.is_active), [users.data]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    create.reset();
    setName("");
    setIdentityType("service_account");
    setOwnerId("");
    setEnvironment("");
    setRiskLevel("low");
    setDescription("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!ownerId) {
      setError("Every non-human identity needs a human owner — pick an org member.");
      return;
    }
    try {
      await create.mutateAsync({
        name: name.trim(),
        identity_type: identityType,
        owner_user_id: ownerId,
        environment: environment.trim() || null,
        risk_level: riskLevel,
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
      title="Register Non-Human Identity"
      subtitle="Service accounts, API keys, and bots need owners"
      icon={KeySquare}
      accent="purple"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nhi-name" className={labelCls}>
            Name
          </label>
          <input
            id="nhi-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={1}
            maxLength={255}
            placeholder="e.g. ci-deploy-bot"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nhi-type" className={labelCls}>
              Identity type
            </label>
            <select id="nhi-type" value={identityType} onChange={(e) => setIdentityType(e.target.value as NhiType)} className={selectCls}>
              {NHI_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nhi-owner" className={labelCls}>
              Owner
            </label>
            <select id="nhi-owner" value={ownerId} onChange={(e) => setOwnerId(e.target.value)} required className={selectCls}>
              <option value="">Select an org member…</option>
              {activeUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email}
                </option>
              ))}
            </select>
            {users.isSuccess && activeUsers.length === 0 ? (
              <p className="text-[11px] text-cv-mist">No active members available to own this identity.</p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nhi-env" className={labelCls}>
              Environment <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <input
              id="nhi-env"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              maxLength={64}
              placeholder="e.g. production"
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nhi-risk" className={labelCls}>
              Risk level
            </label>
            <select id="nhi-risk" value={riskLevel} onChange={(e) => setRiskLevel(e.target.value as NhiRiskLevel)} className={selectCls}>
              {NHI_RISK_LEVELS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="nhi-desc" className={labelCls}>
            Description <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
          </label>
          <textarea
            id="nhi-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What this identity does and where it is used…"
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
            Register identity
          </button>
        </div>
      </form>
    </Modal>
  );
}
