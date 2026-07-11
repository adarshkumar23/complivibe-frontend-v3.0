import { apiFetch } from "@/lib/api/client";

/**
 * Audit domain API — typed against the live backend schema
 * (/api/v1/compliance/audit-engagements*, /audit-findings*, /pbc-items*, /api/v1/exports).
 */

// ── GET /api/v1/compliance/audit-engagements + /dashboard ───────────────────
export type AuditEngagement = {
  id: string;
  title?: string | null;
  audit_type?: string | null;
  status?: string | null;
  framework_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

export function getAuditEngagements(params = "") {
  return apiFetch<AuditEngagement[]>(`/api/v1/compliance/audit-engagements${params}`);
}

export type AuditEngagementsDashboard = {
  total_engagements: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  upcoming: number;
  overdue: number;
};

export function getAuditEngagementsDashboard() {
  return apiFetch<AuditEngagementsDashboard>("/api/v1/compliance/audit-engagements/dashboard");
}

// ── GET /api/v1/compliance/audit-findings/summary ───────────────────────────
export type AuditFindingsSummary = {
  total: number;
  by_severity: Record<string, number>;
  by_status: Record<string, number>;
  open_critical_count: number;
  overdue_count: number;
  linked_to_risk_count: number;
};

export function getAuditFindingsSummary() {
  return apiFetch<AuditFindingsSummary>("/api/v1/compliance/audit-findings/summary");
}

// ── GET /api/v1/compliance/pbc-items/summary ────────────────────────────────
export type PbcItemsSummary = {
  total_items: number;
  by_status: Record<string, number>;
  overdue_count: number;
  completion_rate: number;
  items_without_evidence: number;
  avg_days_to_submit: number | null;
};

export function getPbcItemsSummary() {
  return apiFetch<PbcItemsSummary>("/api/v1/compliance/pbc-items/summary");
}

// ── GET /api/v1/exports/summary ─────────────────────────────────────────────
export type ExportsSummary = {
  [key: string]: unknown;
};

export function getExportsSummary() {
  return apiFetch<ExportsSummary>("/api/v1/exports/summary");
}
