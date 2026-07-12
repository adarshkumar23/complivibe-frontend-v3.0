import { apiFetch } from "@/lib/api/client";

/**
 * Privacy + DPDP API — typed against the live backend schema (/api/v1/privacy/*).
 */

// ── GET /api/v1/privacy/consent/summary ─────────────────────────────────────
export type ConsentSummary = {
  total_records: number;
  active_consents: number;
  withdrawn_count: number;
  expired_count: number;
  consent_rate_pct: number;
  expiring_soon_30d: number;
  active_without_notice_count: number;
  context_flags: string[] | null;
};

export function getConsentSummary() {
  return apiFetch<ConsentSummary>("/api/v1/privacy/consent/summary");
}

// ── GET /api/v1/privacy/ropa/activities ─────────────────────────────────────
// Consent records must reference an existing processing activity (RoPA).
export type ProcessingActivity = {
  id: string;
  name: string;
  purpose: string | null;
  legal_basis: string | null;
  status: string | null;
  risk_level: string | null;
  created_at: string;
};

export function getRopaActivities() {
  return apiFetch<ProcessingActivity[]>("/api/v1/privacy/ropa/activities");
}

// ── POST /api/v1/privacy/consent (ConsentRecordCreate → ConsentRecordRead) ──
// Allowed consent_mechanism values (backend ALLOWED_CONSENT_MECHANISMS):
// explicit_checkbox, cookie_banner, written_form, verbal_recorded, api_consent,
// implied, ccpa_opt_out. Guardian fields are DPDP §9 verifiable-consent support.
export type ConsentCreateInput = {
  processing_activity_id: string;
  subject_identifier: string;
  consent_mechanism: string;
  notice_id?: string | null;
  consent_version?: string | null;
  granted?: boolean;
  expiry_date?: string | null;
  metadata?: Record<string, unknown>;
  is_minor_or_guardian_managed?: boolean;
  guardian_relationship?: string | null;
  guardian_identity_reference?: string | null;
  guardian_verification_method?: string | null;
};

export type ConsentRecord = {
  id: string;
  processing_activity_id: string;
  subject_identifier: string;
  subject_identifier_hash: string | null;
  consent_mechanism: string;
  consent_version: string | null;
  granted: boolean;
  granted_at: string | null;
  withdrawn_at: string | null;
  expiry_date: string | null;
  is_minor_or_guardian_managed: boolean | null;
  guardian_relationship: string | null;
  created_at: string;
};

export function createConsent(body: ConsentCreateInput) {
  return apiFetch<ConsentRecord>("/api/v1/privacy/consent", { method: "POST", body: JSON.stringify(body) });
}

// ── GET /api/v1/privacy/dsr + /summary ──────────────────────────────────────
export type DataSubjectRequest = {
  id: string;
  request_ref: string | null;
  request_type: string;
  /** DPDP: "rights_request" or "grievance" (90-day SLA under Rule 14(3)). */
  request_subtype: string | null;
  status: string;
  subject_email: string | null;
  subject_name: string | null;
  regulatory_framework: string | null;
  identity_verified: boolean | null;
  is_overdue: boolean | null;
  days_to_deadline: number | null;
  age_days: number | null;
  response_deadline: string | null;
  extension_granted: boolean | null;
  submitted_by_nominee_id: string | null;
  step_completion_rate: number | null;
  created_at: string;
  context_flags: string[] | null;
};

export function getDsrRequests(params = "") {
  return apiFetch<DataSubjectRequest[]>(`/api/v1/privacy/dsr${params}`);
}

// ── POST /api/v1/privacy/dsr (DataSubjectRequestCreate) ─────────────────────
// Grievances are DSRs with request_subtype = "grievance" (90-day SLA, Rule 14(3)).
// Allowed request_type values (backend ALLOWED_REQUEST_TYPES): access, erasure,
// portability, rectification, restriction, objection, opt_out_of_sale,
// limit_sensitive, know, correct. Frameworks: gdpr, ccpa, dpdp, lgpd, custom.
export type DsrCreateInput = {
  request_type: string;
  subject_name: string;
  subject_email: string;
  subject_identifier?: string | null;
  description?: string | null;
  regulatory_framework?: string;
  deadline_days?: number | null;
  request_subtype?: "rights_request" | "grievance" | null;
  data_categories?: string[];
  submitted_by_nominee_id?: string | null;
  relationship_end_date?: string | null;
};

export function createDsr(body: DsrCreateInput) {
  return apiFetch<DataSubjectRequest>("/api/v1/privacy/dsr", { method: "POST", body: JSON.stringify(body) });
}

export type DsrSummary = {
  total: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  by_framework: Record<string, number>;
  overdue_count: number;
  avg_days_to_fulfill: number;
  sla_compliance_rate: number;
  open_count: number;
  breached_open_count: number;
  verified_pending_fulfillment_count: number;
  context_flags: string[] | null;
};

export function getDsrSummary() {
  return apiFetch<DsrSummary>("/api/v1/privacy/dsr/summary");
}

// ── GET /api/v1/privacy/dpias/summary, /dpas/summary, /ropa/activities/summary
export type CountSummary = Record<string, unknown> & { total?: number };

export function getDpiaSummary() {
  return apiFetch<CountSummary>("/api/v1/privacy/dpias/summary");
}

export function getDpaSummary() {
  return apiFetch<CountSummary>("/api/v1/privacy/dpas/summary");
}

export function getRopaSummary() {
  return apiFetch<CountSummary>("/api/v1/privacy/ropa/activities/summary");
}

export function getLawfulBasisSummary() {
  return apiFetch<CountSummary>("/api/v1/privacy/lawful-basis/summary");
}

// ── Nominations (DPDP Section 14) ───────────────────────────────────────────
export type Nomination = {
  id: string;
  subject_identifier_hash: string | null;
  nominee_user_id: string | null;
  nominee_name: string | null;
  nominee_contact: string | null;
  activation_trigger: string | null;
  status: string;
  activated_at: string | null;
  revoked_at: string | null;
  revocation_reason: string | null;
  created_at: string;
};

export function createNomination(body: {
  subject_identifier: string;
  activation_trigger: string;
  nominee_name: string;
  nominee_contact?: string;
}) {
  return apiFetch<Nomination>("/api/v1/privacy/nominations", { method: "POST", body: JSON.stringify(body) });
}

/** Returns null when no nomination is currently ACTIVE for the subject. */
export function getActiveNomination(subjectIdentifier: string) {
  return apiFetch<Nomination | null>(
    `/api/v1/privacy/nominations/active?subject_identifier=${encodeURIComponent(subjectIdentifier)}`
  );
}

// ── SDF designation (DPDP Rules 2025, Rule 13) ──────────────────────────────
export type SdfSuggestion = {
  id: string;
  suggested_sdf: boolean;
  sensitive_asset_count: number;
  total_asset_count: number;
  rationale: string | null;
  confirmed_value?: boolean | null;
  sdf_category?: string | null;
  [key: string]: unknown;
};

export function suggestSdfDesignation() {
  return apiFetch<SdfSuggestion>("/api/v1/privacy/sdf-designation/suggest", { method: "POST", body: "{}" });
}

export function confirmSdfDesignation(body: { confirmed_value: boolean; sdf_category?: string }) {
  return apiFetch<SdfSuggestion>("/api/v1/privacy/sdf-designation/confirm", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

// ── Cross-framework reconciliation via common controls ──────────────────────
export type CommonControlsSummary = {
  total_common_controls: number;
  total_mappings: number;
  by_mapping_strength: Record<string, number>;
  frameworks_with_common_controls: number;
  top_common_controls: {
    control_id: string;
    control_name: string;
    framework_count: number;
    obligation_count: number;
  }[];
};

export function getCommonControlsSummary() {
  return apiFetch<CommonControlsSummary>("/api/v1/compliance/common-controls/summary");
}
