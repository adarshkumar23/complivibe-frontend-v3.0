"use client";

import { useState } from "react";
import { ClipboardList, Loader2, ShieldAlert } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import type { PbcItem } from "@/lib/api/audit-pack";
import { useCreatePbcItem } from "@/lib/hooks/useAuditPack";
import { useOrgUsers } from "@/lib/hooks/useRisks";

const inputBase =
  "w-full rounded-2xl bg-white/65 px-3.5 py-2.5 text-sm text-cv-ink placeholder:text-cv-mist ring-1 ring-white/70 transition focus:outline-none focus:ring-2 focus:ring-cv-blue/45";
const labelBase = "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";

/** Create form for POST /api/v1/compliance/pbc-items?engagement_id={id}. */
export function PbcItemCreateModal({
  engagementId,
  engagementTitle,
  open,
  onClose,
  onCreated
}: {
  engagementId: string;
  engagementTitle?: string;
  open: boolean;
  onClose: () => void;
  onCreated?: (item: PbcItem) => void;
}) {
  const create = useCreatePbcItem(engagementId);
  const users = useOrgUsers();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const err = create.error instanceof ApiError ? create.error : null;
  const featureGated = err?.status === 403;
  const userList = users.data ?? [];

  function resetAndClose() {
    setTitle("");
    setDescription("");
    setAssigneeId("");
    setDueDate("");
    setFormError(null);
    create.reset();
    onClose();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!title.trim()) {
      setFormError("Describe the document or artifact being requested.");
      return;
    }
    if (!dueDate) {
      setFormError("A due date is required.");
      return;
    }
    try {
      const created = await create.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        assignee_id: assigneeId || null,
        due_date: dueDate
      });
      onCreated?.(created);
      resetAndClose();
    } catch {
      // surfaced below via create.error
    }
  }

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title="New PBC Request"
      subtitle={engagementTitle ? `Requested for “${engagementTitle}”` : "Requested for the selected engagement"}
      icon={ClipboardList}
      accent="purple"
      widthClassName="max-w-xl"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="pbc-title" className={labelBase}>
              Requested item
            </label>
            <input
              id="pbc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              placeholder="e.g. Q2 access review sign-off for production systems"
              className={inputBase}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="pbc-description" className={labelBase}>
              Details <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <textarea
              id="pbc-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Period covered, format, systems in scope"
              className={inputBase}
            />
          </div>

          <div>
            <label htmlFor="pbc-assignee" className={labelBase}>
              Assignee <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <select id="pbc-assignee" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={inputBase}>
              <option value="">{users.isLoading ? "Loading members…" : users.isError ? "Members unavailable" : "Unassigned"}</option>
              {userList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="pbc-due" className={labelBase}>
              Due date
            </label>
            <input id="pbc-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputBase} />
          </div>
        </div>

        {formError ? (
          <p className="rounded-2xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">
            {formError}
          </p>
        ) : null}
        {err ? (
          featureGated ? (
            <div className="flex items-start gap-2.5 rounded-2xl bg-amber-500/10 px-3.5 py-2.5 ring-1 ring-amber-400/25">
              <ShieldAlert size={15} className="mt-0.5 shrink-0 text-amber-600" />
              <p className="text-xs leading-relaxed text-amber-700">
                <span className="font-bold">Plan upgrade required.</span> {err.message}
              </p>
            </div>
          ) : (
            <p className="rounded-2xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">
              {err.message}
            </p>
          )
        ) : null}

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
            Create request
          </button>
        </div>
      </form>
    </Modal>
  );
}
