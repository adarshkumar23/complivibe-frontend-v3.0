"use client";

import { useState } from "react";
import { Loader2, MailPlus, MessageSquareWarning } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils/cn";
import { useCreateDsr } from "@/lib/hooks/usePrivacy";
import { useHasPermission } from "@/lib/hooks/usePermissions";
import type { DataSubjectRequest } from "@/lib/api/privacy";

const inputCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none";
const labelCls = "mb-1 block text-[11px] font-bold uppercase tracking-wide text-cv-slate";

// Backend ALLOWED_REQUEST_TYPES (app/privacy/services/dsar_service.py).
const REQUEST_TYPES = [
  { value: "access", label: "Access" },
  { value: "erasure", label: "Erasure" },
  { value: "rectification", label: "Rectification" },
  { value: "portability", label: "Portability" },
  { value: "restriction", label: "Restriction" },
  { value: "objection", label: "Objection" },
  { value: "opt_out_of_sale", label: "Opt out of sale (CCPA)" },
  { value: "limit_sensitive", label: "Limit sensitive use (CCPA)" },
  { value: "know", label: "Right to know (CCPA)" },
  { value: "correct", label: "Correct (CCPA)" }
];

// Backend ALLOWED_FRAMEWORKS.
const FRAMEWORKS = [
  { value: "dpdp", label: "DPDP (India)" },
  { value: "gdpr", label: "GDPR" },
  { value: "ccpa", label: "CCPA" },
  { value: "lgpd", label: "LGPD" },
  { value: "custom", label: "Custom" }
];

/**
 * Submit a data subject request or a DPDP grievance.
 * Both ride POST /api/v1/privacy/dsr; grievances set request_subtype = "grievance"
 * and get a 90-day SLA (DPDP Rules 2025, Rule 14(3)) computed by the backend.
 */
export function DsarSubmitForm() {
  const canWritePrivacy = useHasPermission("privacy:write");
  const createDsr = useCreateDsr();

  const [subtype, setSubtype] = useState<"rights_request" | "grievance">("rights_request");
  const [requestType, setRequestType] = useState("access");
  const [framework, setFramework] = useState("dpdp");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<DataSubjectRequest | null>(null);

  const isGrievance = subtype === "grievance";

  function handleSubmit() {
    setFormError(null);
    if (!name.trim() || !email.trim()) {
      setFormError("Subject name and email are required.");
      return;
    }
    if (isGrievance && !description.trim()) {
      setFormError("Describe the grievance so it can be investigated.");
      return;
    }
    createDsr.mutate(
      {
        request_type: requestType,
        subject_name: name.trim(),
        subject_email: email.trim(),
        description: description.trim() || null,
        regulatory_framework: framework,
        request_subtype: subtype
      },
      {
        onSuccess: (record) => {
          setCreated(record);
          setName("");
          setEmail("");
          setDescription("");
        },
        onError: (err) => setFormError(err instanceof Error ? err.message : "Failed to submit request.")
      }
    );
  }

  return (
    <SectionCard
      title="Submit Request or Grievance"
      subtitle="Data principal rights request, or a DPDP grievance (90-day SLA)"
      icon={isGrievance ? MessageSquareWarning : MailPlus}
      accent={isGrievance ? "amber" : "blue"}
      className="h-full"
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-white/45 p-1 ring-1 ring-white/60" role="tablist" aria-label="Request kind">
          {(
            [
              { key: "rights_request", label: "Rights request" },
              { key: "grievance", label: "Grievance" }
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={subtype === t.key}
              onClick={() => setSubtype(t.key)}
              className={cn(
                "cv-ring-focus rounded-lg px-3 py-2 text-[12px] font-bold transition",
                subtype === t.key ? "bg-cv-brand text-white shadow-tile" : "text-cv-slate hover:bg-white/70 hover:text-cv-ink"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="dsr-name" className={labelCls}>
              Subject name
            </label>
            <input id="dsr-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={inputCls} />
          </div>
          <div>
            <label htmlFor="dsr-email" className={labelCls}>
              Subject email
            </label>
            <input
              id="dsr-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="dsr-type" className={labelCls}>
              {isGrievance ? "Underlying right" : "Request type"}
            </label>
            <select id="dsr-type" value={requestType} onChange={(e) => setRequestType(e.target.value)} className={inputCls}>
              {REQUEST_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dsr-framework" className={labelCls}>
              Framework
            </label>
            <select id="dsr-framework" value={framework} onChange={(e) => setFramework(e.target.value)} className={inputCls}>
              {FRAMEWORKS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="dsr-description" className={labelCls}>
            {isGrievance ? "Grievance details" : "Description (optional)"}
          </label>
          <textarea
            id="dsr-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder={isGrievance ? "What went wrong, and what remedy is sought?" : "Context for the handler"}
            className={cn(inputCls, "resize-y")}
          />
        </div>

        {canWritePrivacy ? (
          <button
            type="button"
            data-testid="submit-dsr"
            onClick={handleSubmit}
            disabled={createDsr.isPending}
            className="cv-ring-focus inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-cv-brand px-4 py-2.5 text-[13px] font-bold text-white shadow-tile transition hover:opacity-90 disabled:opacity-60"
          >
            {createDsr.isPending ? <Loader2 size={14} className="animate-spin" /> : isGrievance ? <MessageSquareWarning size={14} /> : <MailPlus size={14} />}
            {isGrievance ? "Submit grievance" : "Submit request"}
          </button>
        ) : null}

        {formError ? <p className="text-[12px] font-medium text-rose-600">{formError}</p> : null}
        {created ? (
          <div className="rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60" data-testid="dsr-created">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] font-semibold text-cv-ink">
                {created.request_ref ? <span className="mr-1.5 text-cv-blue">{created.request_ref}</span> : null}
                {created.request_subtype === "grievance" ? "Grievance received" : "Request received"}
              </p>
              <StatusBadge label={created.status.replaceAll("_", " ")} tone="info" />
            </div>
            <p className="mt-0.5 text-[11px] text-cv-slate">
              {[
                created.regulatory_framework,
                created.response_deadline ? `respond by ${new Date(created.response_deadline).toLocaleDateString()}` : null,
                created.days_to_deadline != null ? `${created.days_to_deadline}d SLA` : null
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
