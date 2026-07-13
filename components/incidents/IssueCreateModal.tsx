"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertOctagon, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";
import { ISSUE_SEVERITIES, ISSUE_TYPES } from "@/lib/api/compliance";
import { ApiError } from "@/lib/api/client";
import { useCreateIssue } from "@/lib/hooks/useIncidentsPage";
import type { OrgUser } from "@/lib/api/users";

const labelCls = "text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";
const inputCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-sm text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none";
const selectCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3 py-2.5 text-sm font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none";

function prettify(v: string) {
  return v.replaceAll("_", " ");
}

type Props = {
  open: boolean;
  onClose: () => void;
  users: OrgUser[];
};

/**
 * POST /api/v1/compliance/issues — owner_id is required and must be an active
 * org member (server-validated). assigned_to is optional, same constraint.
 */
export function IssueCreateModal({ open, onClose, users }: Props) {
  const createIssue = useCreateIssue();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [issueType, setIssueType] = useState<string>("compliance_violation");
  const [severity, setSeverity] = useState<string>("medium");
  const [ownerId, setOwnerId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const activeUsers = useMemo(() => users.filter((u) => u.is_active && u.status === "active"), [users]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    createIssue.reset();
    setTitle("");
    setDescription("");
    setIssueType("compliance_violation");
    setSeverity("medium");
    setOwnerId(activeUsers[0]?.id ?? "");
    setAssignedTo("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createIssue.mutateAsync({
        title,
        description,
        issue_type: issueType,
        severity,
        source_type: "manual",
        owner_id: ownerId,
        assigned_to: assignedTo || null
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
      title="Open Compliance Issue"
      subtitle="Records a governance/compliance issue with SLA tracking"
      icon={AlertOctagon}
      accent="amber"
    >
      {activeUsers.length === 0 ? (
        <p className="rounded-xl bg-amber-400/10 px-3.5 py-3 text-xs font-semibold text-amber-700 ring-1 ring-amber-400/25">
          No active org members available to own this issue — the backend requires owner_id to reference an active member.
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="issue-title" className={labelCls}>
              Title
            </label>
            <input
              id="issue-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={1}
              maxLength={255}
              placeholder="e.g. Vendor SOC2 report expired"
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="issue-description" className={labelCls}>
              Description
            </label>
            <textarea
              id="issue-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={1}
              rows={3}
              placeholder="What happened, scope, impact…"
              className={cn(inputCls, "resize-y")}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="issue-type" className={labelCls}>
                Issue type
              </label>
              <select id="issue-type" value={issueType} onChange={(e) => setIssueType(e.target.value)} className={selectCls}>
                {ISSUE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {prettify(t)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="issue-severity" className={labelCls}>
                Severity
              </label>
              <select id="issue-severity" value={severity} onChange={(e) => setSeverity(e.target.value)} className={selectCls}>
                {ISSUE_SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {prettify(s)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="issue-owner" className={labelCls}>
                Owner
              </label>
              <select id="issue-owner" value={ownerId} onChange={(e) => setOwnerId(e.target.value)} required className={selectCls}>
                {activeUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || u.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="issue-assignee" className={labelCls}>
                Assign to <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
              </label>
              <select id="issue-assignee" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className={selectCls}>
                <option value="">Unassigned</option>
                {activeUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || u.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-[10px] text-cv-mist">Source: manual (this form). Detected data incidents can also be escalated into issues directly.</p>

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
              disabled={createIssue.isPending}
              className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-5 py-2 text-[13px] font-semibold text-white shadow-tile transition hover:opacity-90 disabled:opacity-60"
            >
              {createIssue.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
              Open issue
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
