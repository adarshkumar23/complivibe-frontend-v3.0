"use client";

import { useState } from "react";
import { Loader2, ShieldAlert, TriangleAlert } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { FINDING_SEVERITIES, type AuditFinding } from "@/lib/api/audit-pack";
import { useCreateFinding } from "@/lib/hooks/useAuditPack";
import { useOrgUsers } from "@/lib/hooks/useRisks";

const inputBase =
  "w-full rounded-2xl bg-white/65 px-3.5 py-2.5 text-sm text-cv-ink placeholder:text-cv-mist ring-1 ring-white/70 transition focus:outline-none focus:ring-2 focus:ring-cv-blue/45";
const labelBase = "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";

/** Create form for POST /api/v1/compliance/audit-findings?engagement_id={id}. */
export function FindingCreateModal({
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
  onCreated?: (finding: AuditFinding) => void;
}) {
  const create = useCreateFinding(engagementId);
  const users = useOrgUsers();

  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<(typeof FINDING_SEVERITIES)[number]>("medium");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [remediationAction, setRemediationAction] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [frameworkRef, setFrameworkRef] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const err = create.error instanceof ApiError ? create.error : null;
  const featureGated = err?.status === 403;
  const userList = users.data ?? [];

  function resetAndClose() {
    setTitle("");
    setSeverity("medium");
    setDescription("");
    setOwnerId("");
    setRemediationAction("");
    setTargetDate("");
    setFrameworkRef("");
    setFormError(null);
    create.reset();
    onClose();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!title.trim()) {
      setFormError("Give the finding a title.");
      return;
    }
    if (!description.trim()) {
      setFormError("Describe the finding — this is what the auditor observed.");
      return;
    }
    if (!ownerId) {
      setFormError("Assign a remediation owner.");
      return;
    }
    if (!remediationAction.trim()) {
      setFormError("A remediation action is required.");
      return;
    }
    if (!targetDate) {
      setFormError("Set a target remediation date.");
      return;
    }
    try {
      const created = await create.mutateAsync({
        severity,
        title: title.trim(),
        description: description.trim(),
        assigned_owner_id: ownerId,
        remediation_action: remediationAction.trim(),
        target_remediation_date: targetDate,
        framework_ref: frameworkRef.trim() || null
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
      title="New Audit Finding"
      subtitle={engagementTitle ? `Recorded against “${engagementTitle}”` : "Recorded against the selected engagement"}
      icon={TriangleAlert}
      accent="red"
      widthClassName="max-w-xl"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="finding-title" className={labelBase}>
              Title
            </label>
            <input
              id="finding-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              placeholder="e.g. Access reviews not performed for production DB"
              className={inputBase}
            />
          </div>

          <div>
            <label htmlFor="finding-severity" className={labelBase}>
              Severity
            </label>
            <select
              id="finding-severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as (typeof FINDING_SEVERITIES)[number])}
              className={inputBase}
            >
              {FINDING_SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="finding-framework" className={labelBase}>
              Framework ref <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <input
              id="finding-framework"
              value={frameworkRef}
              onChange={(e) => setFrameworkRef(e.target.value)}
              maxLength={255}
              placeholder="e.g. ISO 27001 A.9.2.5"
              className={inputBase}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="finding-description" className={labelBase}>
              Description
            </label>
            <textarea
              id="finding-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What was observed, and the evidence behind it"
              className={inputBase}
            />
          </div>

          <div>
            <label htmlFor="finding-owner" className={labelBase}>
              Remediation owner
            </label>
            <select id="finding-owner" value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className={inputBase}>
              <option value="">{users.isLoading ? "Loading members…" : users.isError ? "Members unavailable" : "Select owner…"}</option>
              {userList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="finding-target" className={labelBase}>
              Target remediation date
            </label>
            <input id="finding-target" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className={inputBase} />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="finding-remediation" className={labelBase}>
              Remediation action
            </label>
            <textarea
              id="finding-remediation"
              value={remediationAction}
              onChange={(e) => setRemediationAction(e.target.value)}
              rows={2}
              placeholder="The agreed corrective action"
              className={inputBase}
            />
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
            Record finding
          </button>
        </div>
      </form>
    </Modal>
  );
}
