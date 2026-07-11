import { apiFetch } from "@/lib/api/client";

/**
 * Reports API — typed against the live backend schema (/api/v1/reports*).
 */

// ── GET /api/v1/reports ─────────────────────────────────────────────────────
export type Report = {
  id: string;
  title?: string | null;
  report_type?: string | null;
  status?: string | null;
  framework_id?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

export function getReports(params = "") {
  return apiFetch<{ reports: Report[] }>(`/api/v1/reports${params}`);
}

// ── GET /api/v1/reports/summary ─────────────────────────────────────────────
export type ReportsSummary = {
  total_reports: number;
  generated_reports: number;
  archived_reports: number;
  reports_last_30d: number;
  stale_reports_30d: number;
  archived_ratio: number;
  context_flags: string[] | null;
  latest_executive_summary_at: string | null;
  latest_framework_readiness_at: string | null;
  latest_risk_posture_at: string | null;
};

export function getReportsSummary() {
  return apiFetch<ReportsSummary>("/api/v1/reports/summary");
}

// ── GET /api/v1/reports/regulatory/available-types ──────────────────────────
export type RegulatoryReportType = {
  report_type: string;
  description: string;
};

export function getRegulatoryReportTypes() {
  return apiFetch<{ report_types: RegulatoryReportType[] }>("/api/v1/reports/regulatory/available-types");
}

// ── POST /api/v1/reports/generate ───────────────────────────────────────────
export function generateReport(body: {
  report_type: string;
  title?: string;
  description?: string;
  framework_id?: string;
}) {
  return apiFetch<Report>("/api/v1/reports/generate", { method: "POST", body: JSON.stringify(body) });
}

// ── GET /api/v1/compliance/board-scorecard ──────────────────────────────────
export type BoardScorecardSnapshot = {
  id: string;
  snapshot_label: string | null;
  overall_compliance_score: number | null;
  created_at: string;
};

export function getBoardScorecards(params = "?page_size=10") {
  return apiFetch<{ items: BoardScorecardSnapshot[]; total: number }>(
    `/api/v1/compliance/board-scorecard${params}`
  );
}
