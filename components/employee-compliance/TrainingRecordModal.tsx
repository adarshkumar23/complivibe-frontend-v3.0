"use client";

import { useEffect, useMemo, useState } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { getOrgUsers } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";
import { useCreateTrainingRecord } from "@/lib/hooks/useEmployeeCompliance";

const labelCls = "text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";
const inputCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-sm text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none";
const selectCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3 py-2.5 text-sm font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none";

/**
 * Assign training (POST /api/v1/training-analytics/records). Assignee options
 * are real org members from GET /api/v1/users; due date is sent as an ISO
 * datetime as the schema requires.
 */
export function TrainingRecordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateTrainingRecord();
  const users = useQuery({ queryKey: ["org-users"], queryFn: () => getOrgUsers(), enabled: open });

  const [userId, setUserId] = useState("");
  const [trainingType, setTrainingType] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const members = useMemo(() => users.data ?? [], [users.data]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    create.reset();
    setUserId("");
    setTrainingType("");
    setDueDate("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!userId) {
      setError("Pick the member this training is assigned to.");
      return;
    }
    try {
      await create.mutateAsync({
        user_id: userId,
        training_type: trainingType.trim(),
        due_date: new Date(`${dueDate}T23:59:59`).toISOString()
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
      title="Assign Training"
      subtitle="Track a member's required training to completion"
      icon={GraduationCap}
      accent="blue"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="tr-user" className={labelCls}>
            Assignee
          </label>
          <select id="tr-user" value={userId} onChange={(e) => setUserId(e.target.value)} required className={selectCls}>
            <option value="">
              {users.isLoading ? "Loading members…" : users.isError ? "Could not load members" : "Select a member…"}
            </option>
            {members.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name || u.email} {u.status !== "active" ? `(${u.status})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tr-type" className={labelCls}>
              Training type
            </label>
            <input
              id="tr-type"
              value={trainingType}
              onChange={(e) => setTrainingType(e.target.value)}
              required
              minLength={1}
              maxLength={100}
              placeholder="e.g. security_awareness"
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tr-due" className={labelCls}>
              Due date
            </label>
            <input id="tr-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className={inputCls} />
          </div>
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
            Assign training
          </button>
        </div>
      </form>
    </Modal>
  );
}
