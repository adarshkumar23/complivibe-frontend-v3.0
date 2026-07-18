"use client";

import { useState } from "react";
import { ClipboardPen, Loader2, ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { useCreateConsent, useRopaActivities } from "@/lib/hooks/usePrivacy";
import { useHasPermission } from "@/lib/hooks/usePermissions";
import type { ConsentRecord } from "@/lib/api/privacy";

const inputCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none";
const labelCls = "mb-1 block text-[11px] font-bold uppercase tracking-wide text-cv-slate";

// Backend ALLOWED_CONSENT_MECHANISMS (app/privacy/services/consent_service.py).
const MECHANISMS = [
  { value: "explicit_checkbox", label: "Explicit checkbox" },
  { value: "cookie_banner", label: "Cookie banner" },
  { value: "written_form", label: "Written form" },
  { value: "verbal_recorded", label: "Verbal (recorded)" },
  { value: "api_consent", label: "API consent" },
  { value: "implied", label: "Implied" },
  { value: "ccpa_opt_out", label: "CCPA opt-out" }
];

// DPDP §9 verifiable guardian consent (backend ALLOWED_GUARDIAN_* sets).
const GUARDIAN_RELATIONSHIPS = [
  { value: "parent", label: "Parent (child's data)" },
  { value: "lawful_guardian_disability", label: "Lawful guardian (person with disability)" }
];
const GUARDIAN_VERIFICATION_METHODS = [
  { value: "government_id_token", label: "Government ID token" },
  { value: "digilocker", label: "DigiLocker" },
  { value: "existing_reliable_id", label: "Existing reliable ID" },
  { value: "court_authority_appointment", label: "Court / authority appointment" }
];

/**
 * Record a consent event against a RoPA processing activity.
 * POST /api/v1/privacy/consent — the consent KPIs refresh via query invalidation.
 */
export function ConsentRecorder() {
  const canWritePrivacy = useHasPermission("privacy:write");
  const activities = useRopaActivities();
  const createConsent = useCreateConsent();

  const [activityId, setActivityId] = useState("");
  const [subject, setSubject] = useState("");
  const [mechanism, setMechanism] = useState("explicit_checkbox");
  const [consentVersion, setConsentVersion] = useState("");
  const [granted, setGranted] = useState(true);
  const [expiryDate, setExpiryDate] = useState("");
  const [guardianManaged, setGuardianManaged] = useState(false);
  const [guardianRelationship, setGuardianRelationship] = useState("parent");
  const [guardianReference, setGuardianReference] = useState("");
  const [guardianVerification, setGuardianVerification] = useState("government_id_token");
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<ConsentRecord | null>(null);

  const activityList = activities.data ?? [];

  function handleSubmit() {
    setFormError(null);
    if (!activityId) {
      setFormError("Select the processing activity this consent applies to.");
      return;
    }
    if (!subject.trim()) {
      setFormError("Subject identifier is required.");
      return;
    }
    if (guardianManaged && !guardianReference.trim()) {
      setFormError("Guardian identity reference is required for guardian-managed consent.");
      return;
    }
    createConsent.mutate(
      {
        processing_activity_id: activityId,
        subject_identifier: subject.trim(),
        consent_mechanism: mechanism,
        consent_version: consentVersion.trim() || null,
        granted,
        expiry_date: expiryDate || null,
        is_minor_or_guardian_managed: guardianManaged,
        guardian_relationship: guardianManaged ? guardianRelationship : null,
        guardian_identity_reference: guardianManaged ? guardianReference.trim() : null,
        guardian_verification_method: guardianManaged ? guardianVerification : null
      },
      {
        onSuccess: (record) => {
          setCreated(record);
          setSubject("");
          setConsentVersion("");
          setExpiryDate("");
          setGuardianReference("");
        },
        onError: (err) => setFormError(err instanceof Error ? err.message : "Failed to record consent.")
      }
    );
  }

  return (
    <SectionCard
      title="Record Consent"
      subtitle="Log a verifiable consent event against a processing activity"
      icon={ClipboardPen}
      accent="green"
      className="h-full"
    >
      {activities.isLoading ? (
        <SkeletonRows rows={4} />
      ) : activityList.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={activities.isError ? "Processing activities unavailable" : "No processing activities"}
          description={
            activities.isError
              ? "Could not load the RoPA register — consent must reference a processing activity."
              : "Consent records must reference a RoPA processing activity. Create one in the RoPA register first."
          }
        />
      ) : (
        <div className="space-y-3">
          <div>
            <label htmlFor="consent-activity" className={labelCls}>
              Processing activity
            </label>
            <select id="consent-activity" value={activityId} onChange={(e) => setActivityId(e.target.value)} className={inputCls}>
              <option value="">Select activity…</option>
              {activityList.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {a.legal_basis ? ` — ${a.legal_basis.replaceAll("_", " ")}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="consent-subject" className={labelCls}>
                Subject identifier
              </label>
              <input
                id="consent-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email or ID (stored hashed)"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="consent-mechanism" className={labelCls}>
                Mechanism
              </label>
              <select id="consent-mechanism" value={mechanism} onChange={(e) => setMechanism(e.target.value)} className={inputCls}>
                {MECHANISMS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="consent-version" className={labelCls}>
                Notice version (optional)
              </label>
              <input
                id="consent-version"
                value={consentVersion}
                onChange={(e) => setConsentVersion(e.target.value)}
                placeholder="e.g. v2.1"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="consent-expiry" className={labelCls}>
                Expiry (optional)
              </label>
              <input id="consent-expiry" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="consent-granted" className={labelCls}>
                Decision
              </label>
              <select
                id="consent-granted"
                value={granted ? "granted" : "denied"}
                onChange={(e) => setGranted(e.target.value === "granted")}
                className={inputCls}
              >
                <option value="granted">Granted</option>
                <option value="denied">Denied / withdrawn</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-[12px] font-semibold text-cv-slate">
            <input
              type="checkbox"
              checked={guardianManaged}
              onChange={(e) => setGuardianManaged(e.target.checked)}
              className="h-4 w-4 rounded accent-cv-blue"
            />
            Guardian-managed consent (DPDP §9 — child or person with disability)
          </label>
          {guardianManaged ? (
            <div className="grid grid-cols-1 gap-3 rounded-xl bg-white/45 p-3 ring-1 ring-white/60 sm:grid-cols-3">
              <select value={guardianRelationship} onChange={(e) => setGuardianRelationship(e.target.value)} className={inputCls} aria-label="Guardian relationship">
                {GUARDIAN_RELATIONSHIPS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
              <input
                value={guardianReference}
                onChange={(e) => setGuardianReference(e.target.value)}
                placeholder="Guardian identity reference"
                className={inputCls}
                aria-label="Guardian identity reference"
              />
              <select value={guardianVerification} onChange={(e) => setGuardianVerification(e.target.value)} className={inputCls} aria-label="Guardian verification method">
                {GUARDIAN_VERIFICATION_METHODS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {canWritePrivacy ? (
            <button
              type="button"
              data-testid="record-consent"
              onClick={handleSubmit}
              disabled={createConsent.isPending}
              className="cv-ring-focus inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-cv-brand px-4 py-2.5 text-[13px] font-bold text-white shadow-tile transition hover:opacity-90 disabled:opacity-60"
            >
              {createConsent.isPending ? <Loader2 size={14} className="animate-spin" /> : <ClipboardPen size={14} />}
              Record consent
            </button>
          ) : null}

          {formError ? <p className="text-[12px] font-medium text-rose-600">{formError}</p> : null}
          {created ? (
            <div className="rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60" data-testid="consent-created">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-semibold text-cv-ink">Consent recorded</p>
                <StatusBadge label={created.granted ? "granted" : "not granted"} tone={created.granted ? "good" : "warn"} />
              </div>
              <p className="mt-0.5 break-all text-[11px] text-cv-slate">
                {[
                  `id: ${created.id}`,
                  created.consent_mechanism.replaceAll("_", " "),
                  created.expiry_date ? `expires ${created.expiry_date}` : null,
                  created.is_minor_or_guardian_managed ? "guardian-managed (§9)" : null
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </SectionCard>
  );
}
