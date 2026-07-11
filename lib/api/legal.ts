import { apiFetch } from "@/lib/api/client";

/**
 * Legal + Whistleblower API — typed against the live backend schema
 * (/api/v1/legal-matters*, /api/v1/whistleblower/*).
 */

// ── GET /api/v1/legal-matters ───────────────────────────────────────────────
export type LegalMatter = {
  id: string;
  title: string;
  description: string | null;
  matter_type: string | null;
  status: string;
  opposing_party: string | null;
  outside_counsel: string | null;
  budget: string | null;
  related_risk_id: string | null;
  related_issue_id: string | null;
  risk_severity_at_link: string | null;
  owner_user_id: string | null;
  opened_at: string | null;
  closed_at: string | null;
  created_at: string;
  /** Backend flags: linked risk got worse since this matter was opened. */
  risk_escalated_since_linked: boolean | null;
  open_linked_issue_warning: string | null;
  linked_evidence_count: number | null;
  linked_control_count: number | null;
};

export function getLegalMatters(params = "") {
  return apiFetch<LegalMatter[]>(`/api/v1/legal-matters${params}`);
}

// ── GET /api/v1/whistleblower/reports ───────────────────────────────────────
export type WhistleblowerReport = {
  id: string;
  anonymous_id: string | null;
  category: string | null;
  description: string | null;
  status: string;
  assigned_investigator_user_id: string | null;
  resolution_summary: string | null;
  created_at: string;
  updated_at: string;
  days_open: number | null;
  context_flags: string[] | null;
};

export function getWhistleblowerReports(params = "") {
  return apiFetch<WhistleblowerReport[]>(`/api/v1/whistleblower/reports${params}`);
}

// ── POST /api/v1/legal-matters (LegalMatterCreate) ──────────────────────────
/** Allowed matter_type values (pattern on LegalMatterCreate.matter_type). */
export const LEGAL_MATTER_TYPES = [
  "litigation",
  "regulatory_inquiry",
  "contract_dispute",
  "ip_dispute",
  "employment",
  "other"
] as const;
export type LegalMatterType = (typeof LEGAL_MATTER_TYPES)[number];

export type LegalMatterCreatePayload = {
  title: string;
  description?: string | null;
  matter_type?: LegalMatterType;
  opposing_party?: string | null;
  outside_counsel?: string | null;
  budget?: number | null;
  owner_user_id?: string | null;
};

export function createLegalMatter(payload: LegalMatterCreatePayload) {
  return apiFetch<LegalMatter>("/api/v1/legal-matters", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// ── POST /api/v1/whistleblower/submit (WhistleblowerReportSubmitRequest) ────
/** Allowed category values (pattern on WhistleblowerReportSubmitRequest.category). */
export const WHISTLEBLOWER_CATEGORIES = [
  "fraud",
  "corruption",
  "harassment",
  "safety_violation",
  "data_privacy",
  "financial_misconduct",
  "discrimination",
  "retaliation",
  "other"
] as const;
export type WhistleblowerCategory = (typeof WHISTLEBLOWER_CATEGORIES)[number];

export type WhistleblowerSubmitResponse = {
  tracking_code: string;
  anonymous_id: string;
  warning: string | null;
};

/**
 * Anonymous channel: the backend requires organization_id in the body (the
 * endpoint is designed to also work unauthenticated). We read the active org
 * from local storage, same source apiFetch uses for the X-Organization-ID header.
 */
export function submitWhistleblowerReport(payload: { category: WhistleblowerCategory; description: string }) {
  const orgId = typeof window !== "undefined" ? localStorage.getItem("cv_org") : null;
  if (!orgId) {
    return Promise.reject(new Error("No active organization — sign in again to submit a report."));
  }
  return apiFetch<WhistleblowerSubmitResponse>("/api/v1/whistleblower/submit", {
    method: "POST",
    body: JSON.stringify({ organization_id: orgId, ...payload })
  });
}
