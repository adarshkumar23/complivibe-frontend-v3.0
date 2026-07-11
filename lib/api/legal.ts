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
