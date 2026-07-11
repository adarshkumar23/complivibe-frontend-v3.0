import { apiFetch } from "@/lib/api/client";

/**
 * Vendor / TPRM API — typed against the live backend schema
 * (/api/v1/compliance/vendors*, /api/v1/vendor-concentration-risk).
 */

// ── GET /api/v1/compliance/vendors ──────────────────────────────────────────
export type Vendor = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  vendor_type: string | null;
  website: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  risk_tier: string | null;
  risk_tier_source: string | null;
  status: string;
  owner_user_id: string | null;
  data_access: boolean | null;
  processes_personal_data: boolean | null;
  sub_processor: boolean | null;
  nth_party_risk_flag: boolean | null;
  nth_party_risk_severity: string | null;
  nth_party_risk_signal_type: string | null;
  has_overdue_assessment: boolean | null;
  archived_at: string | null;
  annual_spend_amount: string | null;
};

export function getVendors(params = "") {
  return apiFetch<Vendor[]>(`/api/v1/compliance/vendors${params}`);
}

/**
 * Allowed values, from the live backend schema (reports/live-openapi.json):
 * - vendor_type: VendorCreate pattern ^(software|infrastructure|professional_services|data_processor|other)$
 * - risk_tier: pattern ^(critical|high|medium|low|not_assessed)$ (default not_assessed)
 * - status: pattern ^(active|under_review|inactive|archived)$ (default active)
 * - owner_user_id is REQUIRED on create (uuid of an org user).
 */
export const VENDOR_TYPES = ["software", "infrastructure", "professional_services", "data_processor", "other"] as const;
export type VendorType = (typeof VENDOR_TYPES)[number];

export const VENDOR_RISK_TIERS = ["critical", "high", "medium", "low", "not_assessed"] as const;
export type VendorRiskTier = (typeof VENDOR_RISK_TIERS)[number];

export const VENDOR_STATUSES = ["active", "under_review", "inactive", "archived"] as const;
export type VendorStatus = (typeof VENDOR_STATUSES)[number];

// ── POST /api/v1/compliance/vendors (VendorCreate) ──────────────────────────
export type VendorCreatePayload = {
  name: string;
  vendor_type: VendorType;
  owner_user_id: string;
  description?: string | null;
  website?: string | null;
  primary_contact_name?: string | null;
  primary_contact_email?: string | null;
  risk_tier?: VendorRiskTier;
  status?: VendorStatus;
  data_access?: boolean;
  processes_personal_data?: boolean;
  sub_processor?: boolean;
  notes?: string | null;
  annual_spend_amount?: number | null;
};

export function createVendor(payload: VendorCreatePayload) {
  return apiFetch<Vendor>("/api/v1/compliance/vendors", { method: "POST", body: JSON.stringify(payload) });
}

// ── PATCH /api/v1/compliance/vendors/{vendor_id} (VendorUpdate — partial) ───
export type VendorUpdatePayload = Partial<VendorCreatePayload>;

export function updateVendor(vendorId: string, payload: VendorUpdatePayload) {
  return apiFetch<Vendor>(`/api/v1/compliance/vendors/${vendorId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

/**
 * Assessment values, from VendorAssessmentCreate in the live schema:
 * - assessment_type: pattern ^(initial|periodic|triggered|offboarding)$
 * - due_date: ISO date; a PAST due_date on an open assessment flips the
 *   vendor's has_overdue_assessment flag ("Assessment overdue" badge).
 */
export const ASSESSMENT_TYPES = ["initial", "periodic", "triggered", "offboarding"] as const;
export type AssessmentType = (typeof ASSESSMENT_TYPES)[number];

// ── POST/GET /api/v1/compliance/vendors/{vendor_id}/assessments ─────────────
export type VendorAssessment = {
  id: string;
  created_at: string;
  updated_at: string;
  vendor_id: string;
  title: string;
  assessment_type: string;
  status: string;
  assigned_to_user_id: string | null;
  due_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  overall_rating: string;
  is_overdue: boolean;
  notes: string | null;
};

export type VendorAssessmentCreatePayload = {
  title: string;
  assessment_type: AssessmentType;
  assigned_to_user_id?: string | null;
  due_date?: string | null;
  notes?: string | null;
};

export function createVendorAssessment(vendorId: string, payload: VendorAssessmentCreatePayload) {
  return apiFetch<VendorAssessment>(`/api/v1/compliance/vendors/${vendorId}/assessments`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getVendorAssessments(vendorId: string) {
  return apiFetch<VendorAssessment[]>(`/api/v1/compliance/vendors/${vendorId}/assessments`);
}

// ── GET /api/v1/compliance/vendors/summary ──────────────────────────────────
export type VendorSummary = {
  total_vendors: number;
  active_vendors: number;
  archived_vendors: number;
  by_status: Record<string, number>;
  by_risk_tier: Record<string, number>;
  by_vendor_type: Record<string, number>;
};

export function getVendorRiskSummary() {
  return apiFetch<VendorSummary>("/api/v1/compliance/vendors/summary");
}

// ── GET /api/v1/vendor-concentration-risk ───────────────────────────────────
export type VendorConcentrationRisk = {
  id: string | null;
  status: string;
  hhi_score: number;
  threshold_hhi_score: number;
  top_vendor_id: string | null;
  top_vendor_name: string | null;
  top_vendor_share_basis_points: number;
  exposure_count: number;
  critical_vendor_count: number;
  dependency_count: number;
  risk_id: string | null;
  convention_source_title: string | null;
  convention_source_url: string | null;
  recomputed_at: string | null;
};

export function getVendorConcentrationRisk() {
  return apiFetch<VendorConcentrationRisk>("/api/v1/vendor-concentration-risk");
}

// ── POST /api/v1/vendor-concentration-risk/recompute ────────────────────────
// Computes the real HHI from active critical/high-tier vendors and active
// supply-chain dependency links, weighted by annual_spend_amount when captured.
// threshold_hhi_score defaults to 1800 (DOJ/FTC "highly concentrated").
export type VendorConcentrationRecomputeResult = {
  detection: VendorConcentrationRisk;
  risk_created: boolean;
  state_changed: boolean;
};

export function recomputeVendorConcentrationRisk(thresholdHhiScore?: number) {
  return apiFetch<VendorConcentrationRecomputeResult>("/api/v1/vendor-concentration-risk/recompute", {
    method: "POST",
    body: JSON.stringify(thresholdHhiScore != null ? { threshold_hhi_score: thresholdHhiScore } : {})
  });
}
