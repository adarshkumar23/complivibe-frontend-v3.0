"use client";

import { useState } from "react";
import { CalendarPlus, Loader2, ShieldAlert } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { ENGAGEMENT_AUDIT_TYPES, type AuditEngagement } from "@/lib/api/audit-pack";
import { useCreateEngagement } from "@/lib/hooks/useAuditPack";

const inputBase =
  "w-full rounded-2xl bg-white/65 px-3.5 py-2.5 text-sm text-cv-ink placeholder:text-cv-mist ring-1 ring-white/70 transition focus:outline-none focus:ring-2 focus:ring-cv-blue/45";
const labelBase = "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";

function prettify(v: string) {
  return v.replaceAll("_", " ");
}

/** Create form for POST /api/v1/compliance/audit-engagements. */
export function EngagementCreateModal({
  open,
  onClose,
  onCreated
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (engagement: AuditEngagement) => void;
}) {
  const create = useCreateEngagement();

  const [title, setTitle] = useState("");
  const [auditType, setAuditType] = useState<(typeof ENGAGEMENT_AUDIT_TYPES)[number]>("internal_readiness");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leadAuditor, setLeadAuditor] = useState("");
  const [auditFirm, setAuditFirm] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const err = create.error instanceof ApiError ? create.error : null;
  const featureGated = err?.status === 403;

  function resetAndClose() {
    setTitle("");
    setAuditType("internal_readiness");
    setStartDate("");
    setEndDate("");
    setLeadAuditor("");
    setAuditFirm("");
    setNotes("");
    setFormError(null);
    create.reset();
    onClose();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!title.trim()) {
      setFormError("Give the engagement a title.");
      return;
    }
    if (!startDate || !endDate) {
      setFormError("Start and end dates are required.");
      return;
    }
    if (endDate < startDate) {
      setFormError("End date must be on or after the start date.");
      return;
    }
    try {
      const created = await create.mutateAsync({
        title: title.trim(),
        audit_type: auditType,
        start_date: startDate,
        end_date: endDate,
        lead_auditor_name: leadAuditor.trim() || null,
        audit_firm: auditFirm.trim() || null,
        notes: notes.trim() || null
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
      title="New Audit Engagement"
      subtitle="Scope an audit, then track findings and PBC requests against it"
      icon={CalendarPlus}
      accent="blue"
      widthClassName="max-w-xl"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="eng-title" className={labelBase}>
              Title
            </label>
            <input
              id="eng-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              placeholder="e.g. SOC 2 Type II readiness — FY2026"
              className={inputBase}
            />
          </div>

          <div>
            <label htmlFor="eng-type" className={labelBase}>
              Audit type
            </label>
            <select
              id="eng-type"
              value={auditType}
              onChange={(e) => setAuditType(e.target.value as (typeof ENGAGEMENT_AUDIT_TYPES)[number])}
              className={inputBase}
            >
              {ENGAGEMENT_AUDIT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {prettify(t)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="eng-start" className={labelBase}>
                Start
              </label>
              <input id="eng-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputBase} />
            </div>
            <div>
              <label htmlFor="eng-end" className={labelBase}>
                End
              </label>
              <input id="eng-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputBase} />
            </div>
          </div>

          <div>
            <label htmlFor="eng-lead" className={labelBase}>
              Lead auditor <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <input
              id="eng-lead"
              value={leadAuditor}
              onChange={(e) => setLeadAuditor(e.target.value)}
              maxLength={255}
              placeholder="e.g. R. Menon"
              className={inputBase}
            />
          </div>

          <div>
            <label htmlFor="eng-firm" className={labelBase}>
              Audit firm <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <input
              id="eng-firm"
              value={auditFirm}
              onChange={(e) => setAuditFirm(e.target.value)}
              maxLength={255}
              placeholder="e.g. Sentinel Assurance LLP"
              className={inputBase}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="eng-notes" className={labelBase}>
              Notes <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <textarea
              id="eng-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Scope boundaries, audit criteria, logistics"
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
            Create engagement
          </button>
        </div>
      </form>
    </Modal>
  );
}
