import { apiFetch } from "@/lib/api/client";

/**
 * Enterprise governance API — typed against the live backend schema
 * (/api/v1/compliance/business-units, /api/v1/access-certifications, /api/v1/recertification).
 */

// ── GET /api/v1/compliance/business-units ───────────────────────────────────
export type BusinessUnit = {
  id: string;
  name?: string | null;
  parent_id?: string | null;
  is_active?: boolean | null;
  [key: string]: unknown;
};

export function getBusinessUnits() {
  return apiFetch<BusinessUnit[]>("/api/v1/compliance/business-units");
}

// ── GET /api/v1/access-certifications/campaigns ─────────────────────────────
export type AccessCertCampaign = {
  id: string;
  name?: string | null;
  status?: string | null;
  due_date?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

export function getAccessCertCampaigns() {
  return apiFetch<AccessCertCampaign[]>("/api/v1/access-certifications/campaigns");
}

// ── GET /api/v1/recertification/summary ─────────────────────────────────────
export type RecertificationSummary = {
  active_policies: number;
  due_evidence: number;
  expired_evidence: number;
  evidence_needing_review: number;
  due_control_tests: number;
  overdue_control_tests: number;
  runs_last_24h: number;
  tasks_created_last_24h: number;
};

export function getRecertificationSummary() {
  return apiFetch<RecertificationSummary>("/api/v1/recertification/summary");
}
