"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useCreateVendorAssessment, useVendorOwners } from "@/lib/hooks/useVendorRisk";
import { ASSESSMENT_TYPES, type Vendor, type VendorAssessmentCreatePayload } from "@/lib/api/vendor-risk";

const inputCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none";
const labelCls = "mb-1 block text-[11px] font-bold uppercase tracking-wide text-cv-slate";

/**
 * Create a due-diligence assessment for a vendor.
 * POST /api/v1/compliance/vendors/{vendor_id}/assessments (VendorAssessmentCreate:
 * title + assessment_type required). A PAST due date on an open assessment flips
 * the vendor's "Assessment overdue" badge via has_overdue_assessment.
 */
export function VendorAssessmentModal({
  open,
  onClose,
  vendor
}: {
  open: boolean;
  onClose: () => void;
  vendor: Vendor | null;
}) {
  const owners = useVendorOwners();
  const createAssessment = useCreateVendorAssessment();

  const [title, setTitle] = useState("");
  const [assessmentType, setAssessmentType] = useState<string>("periodic");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(vendor ? `${vendor.name} review` : "");
    setAssessmentType("periodic");
    setDueDate("");
    setAssignedTo("");
    setNotes("");
    setFormError(null);
  }, [open, vendor]);

  function handleSubmit() {
    if (!vendor) return;
    setFormError(null);
    if (!title.trim()) {
      setFormError("Assessment title is required.");
      return;
    }
    const payload: VendorAssessmentCreatePayload = {
      title: title.trim(),
      assessment_type: assessmentType as VendorAssessmentCreatePayload["assessment_type"],
      due_date: dueDate || null,
      assigned_to_user_id: assignedTo || null,
      notes: notes.trim() || null
    };
    createAssessment.mutate(
      { vendorId: vendor.id, payload },
      {
        onSuccess: () => onClose(),
        onError: (err) => setFormError(err instanceof Error ? err.message : "The backend rejected this assessment.")
      }
    );
  }

  const userList = owners.data ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New assessment"
      subtitle={vendor ? `Due diligence for ${vendor.name}` : undefined}
      icon={ClipboardList}
      accent="amber"
    >
      <div className="space-y-3" data-testid="assessment-form">
        <div>
          <label htmlFor="assessment-title" className={labelCls}>
            Title
          </label>
          <input
            id="assessment-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Annual security review"
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="assessment-type" className={labelCls}>
              Type
            </label>
            <select
              id="assessment-type"
              value={assessmentType}
              onChange={(e) => setAssessmentType(e.target.value)}
              className={inputCls}
            >
              {ASSESSMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="assessment-due" className={labelCls}>
              Due date (optional)
            </label>
            <input
              id="assessment-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label htmlFor="assessment-assignee" className={labelCls}>
            Assignee (optional)
          </label>
          <select id="assessment-assignee" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className={inputCls}>
            <option value="">Unassigned</option>
            {userList.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name || u.email}
                {u.is_active ? "" : " (inactive)"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="assessment-notes" className={labelCls}>
            Notes (optional)
          </label>
          <textarea
            id="assessment-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Scope, focus areas, context"
            className={inputCls}
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={createAssessment.isPending}
          data-testid="assessment-form-submit"
          className="cv-ring-focus inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-cv-brand px-4 py-2.5 text-[13px] font-bold text-white shadow-tile transition hover:opacity-90 disabled:opacity-60"
        >
          {createAssessment.isPending ? <Loader2 size={14} className="animate-spin" /> : <ClipboardList size={14} />}
          Create assessment
        </button>

        {formError ? (
          <p className="text-[12px] font-medium text-rose-600" data-testid="assessment-form-error">
            {formError}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
