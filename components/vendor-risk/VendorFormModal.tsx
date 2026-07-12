"use client";

import { useEffect, useState } from "react";
import { Building, Loader2, Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useCreateVendor, useUpdateVendor, useVendorOwners } from "@/lib/hooks/useVendorRisk";
import {
  VENDOR_TYPES,
  VENDOR_RISK_TIERS,
  VENDOR_STATUSES,
  type Vendor,
  type VendorCreatePayload
} from "@/lib/api/vendor-risk";

const inputCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none";
const labelCls = "mb-1 block text-[11px] font-bold uppercase tracking-wide text-cv-slate";

function tidy(s: string) {
  return s.replaceAll("_", " ");
}

/**
 * Create / edit a vendor.
 * - POST /api/v1/compliance/vendors (VendorCreate: name, vendor_type, owner_user_id required)
 * - PATCH /api/v1/compliance/vendors/{vendor_id} (VendorUpdate)
 * The owner picker lists real org users from GET /api/v1/users.
 */
export function VendorFormModal({
  open,
  onClose,
  vendor
}: {
  open: boolean;
  onClose: () => void;
  /** When set, the modal edits this vendor; otherwise it creates a new one. */
  vendor?: Vendor | null;
}) {
  const owners = useVendorOwners();
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();
  const editing = Boolean(vendor);
  const pending = createVendor.isPending || updateVendor.isPending;

  const [name, setName] = useState("");
  const [vendorType, setVendorType] = useState<string>("software");
  const [ownerUserId, setOwnerUserId] = useState("");
  const [riskTier, setRiskTier] = useState<string>("not_assessed");
  const [status, setStatus] = useState<string>("active");
  const [website, setWebsite] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [annualSpend, setAnnualSpend] = useState("");
  const [description, setDescription] = useState("");
  const [dataAccess, setDataAccess] = useState(false);
  const [processesPersonalData, setProcessesPersonalData] = useState(false);
  const [subProcessor, setSubProcessor] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Re-seed the form each time the modal opens (fresh create or a different vendor).
  useEffect(() => {
    if (!open) return;
    setName(vendor?.name ?? "");
    setVendorType(vendor?.vendor_type ?? "software");
    setOwnerUserId(vendor?.owner_user_id ?? "");
    setRiskTier(vendor?.risk_tier ?? "not_assessed");
    setStatus(vendor?.status ?? "active");
    setWebsite(vendor?.website ?? "");
    setContactName(vendor?.primary_contact_name ?? "");
    setContactEmail(vendor?.primary_contact_email ?? "");
    setAnnualSpend(vendor?.annual_spend_amount != null ? String(Number(vendor.annual_spend_amount)) : "");
    setDescription(vendor?.description ?? "");
    setDataAccess(Boolean(vendor?.data_access));
    setProcessesPersonalData(Boolean(vendor?.processes_personal_data));
    setSubProcessor(Boolean(vendor?.sub_processor));
    setFormError(null);
  }, [open, vendor]);

  function handleSubmit() {
    setFormError(null);
    if (!name.trim()) {
      setFormError("Vendor name is required.");
      return;
    }
    if (!ownerUserId) {
      setFormError("Select an owner — every vendor needs an accountable org user.");
      return;
    }
    const spend = annualSpend.trim();
    if (spend && (Number.isNaN(Number(spend)) || Number(spend) < 0)) {
      setFormError("Annual spend must be a non-negative number.");
      return;
    }
    const payload: VendorCreatePayload = {
      name: name.trim(),
      vendor_type: vendorType as VendorCreatePayload["vendor_type"],
      owner_user_id: ownerUserId,
      risk_tier: riskTier as VendorCreatePayload["risk_tier"],
      status: status as VendorCreatePayload["status"],
      website: website.trim() || null,
      primary_contact_name: contactName.trim() || null,
      primary_contact_email: contactEmail.trim() || null,
      annual_spend_amount: spend ? Number(spend) : null,
      description: description.trim() || null,
      data_access: dataAccess,
      processes_personal_data: processesPersonalData,
      sub_processor: subProcessor
    };
    const opts = {
      onSuccess: () => onClose(),
      onError: (err: Error) => setFormError(err.message || "The backend rejected this vendor.")
    };
    if (vendor) {
      updateVendor.mutate({ vendorId: vendor.id, payload }, opts);
    } else {
      createVendor.mutate(payload, opts);
    }
  }

  const userList = owners.data ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit vendor" : "Add vendor"}
      subtitle={editing ? vendor?.name : "Register a third party for risk tracking"}
      icon={Building}
      accent="blue"
      widthClassName="max-w-xl"
    >
      <div className="space-y-3" data-testid="vendor-form">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="vendor-name" className={labelCls}>
              Name
            </label>
            <input
              id="vendor-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Cloud"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="vendor-type" className={labelCls}>
              Vendor type
            </label>
            <select id="vendor-type" value={vendorType} onChange={(e) => setVendorType(e.target.value)} className={inputCls}>
              {VENDOR_TYPES.map((t) => (
                <option key={t} value={t}>
                  {tidy(t)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="vendor-owner" className={labelCls}>
            Owner
          </label>
          <select id="vendor-owner" value={ownerUserId} onChange={(e) => setOwnerUserId(e.target.value)} className={inputCls}>
            <option value="">
              {owners.isLoading ? "Loading org users…" : owners.isError ? "Could not load org users" : "Select owner…"}
            </option>
            {userList.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name || u.email}
                {u.full_name ? ` — ${u.email}` : ""}
                {u.is_active ? "" : " (inactive)"}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="vendor-tier" className={labelCls}>
              Risk tier
            </label>
            <select id="vendor-tier" value={riskTier} onChange={(e) => setRiskTier(e.target.value)} className={inputCls}>
              {VENDOR_RISK_TIERS.map((t) => (
                <option key={t} value={t}>
                  {tidy(t)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="vendor-status" className={labelCls}>
              Status
            </label>
            <select id="vendor-status" value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
              {VENDOR_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {tidy(s)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="vendor-website" className={labelCls}>
              Website (optional)
            </label>
            <input
              id="vendor-website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://…"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="vendor-spend" className={labelCls}>
              Annual spend (optional)
            </label>
            <input
              id="vendor-spend"
              type="number"
              min="0"
              value={annualSpend}
              onChange={(e) => setAnnualSpend(e.target.value)}
              placeholder="e.g. 120000"
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="vendor-contact-name" className={labelCls}>
              Primary contact (optional)
            </label>
            <input
              id="vendor-contact-name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Full name"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="vendor-contact-email" className={labelCls}>
              Contact email (optional)
            </label>
            <input
              id="vendor-contact-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="name@vendor.com"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label htmlFor="vendor-description" className={labelCls}>
            Description (optional)
          </label>
          <textarea
            id="vendor-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What this vendor provides"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-1 gap-2 rounded-xl bg-white/45 p-3 ring-1 ring-white/60 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-[12px] font-semibold text-cv-slate">
            <input
              type="checkbox"
              checked={dataAccess}
              onChange={(e) => setDataAccess(e.target.checked)}
              className="h-4 w-4 rounded accent-cv-blue"
            />
            System access
          </label>
          <label className="flex items-center gap-2 text-[12px] font-semibold text-cv-slate">
            <input
              type="checkbox"
              checked={processesPersonalData}
              onChange={(e) => setProcessesPersonalData(e.target.checked)}
              className="h-4 w-4 rounded accent-cv-blue"
            />
            Personal data
          </label>
          <label className="flex items-center gap-2 text-[12px] font-semibold text-cv-slate">
            <input
              type="checkbox"
              checked={subProcessor}
              onChange={(e) => setSubProcessor(e.target.checked)}
              className="h-4 w-4 rounded accent-cv-blue"
            />
            Sub-processor
          </label>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending}
          data-testid="vendor-form-submit"
          className="cv-ring-focus inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-cv-brand px-4 py-2.5 text-[13px] font-bold text-white shadow-tile transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {editing ? "Save changes" : "Add vendor"}
        </button>

        {formError ? (
          <p className="text-[12px] font-medium text-rose-600" data-testid="vendor-form-error">
            {formError}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
