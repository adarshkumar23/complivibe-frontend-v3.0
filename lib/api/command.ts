import { apiFetch } from "@/lib/api/client";

/**
 * Command-center API — typed against the live backend schema
 * (/api/v1/dashboard/summary, /api/v1/compliance-timeline, /api/v1/scoring/*).
 */

// ── GET /api/v1/dashboard/summary ───────────────────────────────────────────
export type DashboardSummary = {
  open_obligations: number;
  open_risks: number;
  pending_tasks: number;
  current_score: number | null;
  current_score_grade: string | null;
  current_score_calculated_at: string | null;
  total_controls: number;
  total_vendors: number;
  total_policies: number;
};

export function getDashboardSummary() {
  return apiFetch<DashboardSummary>("/api/v1/dashboard/summary");
}

// ── GET /api/v1/compliance-timeline ─────────────────────────────────────────
export type TimelineEvent = {
  event_key: string;
  event_type: string;
  occurred_at: string;
  entity_type: string | null;
  entity_id: string | null;
  title: string | null;
  [key: string]: unknown;
};

export type ComplianceTimeline = {
  total_events: number;
  has_more: boolean;
  events: TimelineEvent[];
};

export function getComplianceTimeline() {
  return apiFetch<ComplianceTimeline>("/api/v1/compliance-timeline");
}

// ── GET /api/v1/scoring/summary ─────────────────────────────────────────────
export type ScoringSummary = {
  score: number;
  captured_at: string | null;
};

export function getScoringSummary() {
  return apiFetch<ScoringSummary>("/api/v1/scoring/summary");
}
