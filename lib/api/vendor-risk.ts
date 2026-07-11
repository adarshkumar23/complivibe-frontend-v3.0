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
};

export function getVendorConcentrationRisk() {
  return apiFetch<VendorConcentrationRisk>("/api/v1/vendor-concentration-risk");
}
