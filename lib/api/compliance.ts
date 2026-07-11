import { apiFetch } from "@/lib/api/client";

/**
 * Compliance domain API — typed against the live backend OpenAPI schema
 * (GET /openapi.json, /api/v1/compliance/* + /api/v1/frameworks/*).
 */

// ── GET /api/v1/compliance/dashboard/posture-summary ────────────────────────
export type PostureSummary = {
  active_frameworks: {
    count: number;
    list: { framework_id: string; name: string; coverage_pct: number }[];
  };
  obligations: { total: number; applicable: number; not_applicable: number; unknown: number };
  controls: { total: number; active: number; with_evidence: number; without_evidence: number };
  evidence: { total: number; verified: number; expired: number; needs_review: number };
  risks: {
    total: number;
    by_severity: { critical: number; high: number; medium: number; low: number };
    open_treatments: number;
  };
  tasks: { total: number; overdue: number; due_this_week: number };
  policies: { total: number; approved: number; under_review: number; expired: number };
  vendors: { total: number; by_risk_tier: Record<string, number>; pending_assessments: number };
  monitoring: { active_definitions: number; open_alerts: number; overdue_checks: number };
  deadlines: { upcoming_30_days: number; overdue: number };
};

export function getPostureSummary() {
  return apiFetch<PostureSummary>("/api/v1/compliance/dashboard/posture-summary");
}

// ── GET /api/v1/compliance/dashboard/framework-readiness ────────────────────
export type FrameworkReadinessEntry = {
  framework_id: string;
  name: string;
  coverage_level: string | null;
  obligation_count: number;
  mapped_control_count: number;
  control_coverage_pct: number;
  evidence_verified_pct: number;
  open_gaps_count: number;
  /** Backend-generated explanation of the biggest readiness gap. */
  readiness_insight: string | null;
  last_score_snapshot: number | null;
};

export function getFrameworkReadiness() {
  return apiFetch<FrameworkReadinessEntry[]>("/api/v1/compliance/dashboard/framework-readiness");
}

// ── GET /api/v1/compliance/dashboard/control-health ─────────────────────────
export type ControlHealth = {
  total_controls_by_status: Record<string, number>;
  controls_with_no_evidence: number;
  controls_with_expired_evidence: number;
  controls_with_open_monitoring_alerts: number;
  controls_with_overdue_checks: number;
  controls_mapped_to_0_obligations: number;
  open_high_critical_findings: number;
  health_flag: string;
};

export function getControlHealth() {
  return apiFetch<ControlHealth>("/api/v1/compliance/dashboard/control-health");
}

// ── GET /api/v1/compliance/dashboard/recent-activity ────────────────────────
export type ActivityEntry = {
  id: string;
  created_at: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor_user_id: string | null;
  after_json: Record<string, unknown> | null;
  metadata_json: Record<string, unknown> | null;
};

export function getRecentActivity(limit = 20) {
  return apiFetch<ActivityEntry[]>(`/api/v1/compliance/dashboard/recent-activity?limit=${limit}`);
}

// ── GET /api/v1/compliance/deadlines + /summary ─────────────────────────────
export type Deadline = {
  id: string;
  title: string;
  description: string | null;
  deadline_type: string;
  due_date: string;
  status: string;
  priority: string;
  owner_user_id: string | null;
  days_until_due: number | null;
  recommended_status: string | null;
  is_status_stale: boolean | null;
  context_flags: string[] | null;
};

export type DeadlineSummary = {
  total_deadlines: number;
  upcoming_deadlines: number;
  overdue_deadlines: number;
  completed_deadlines: number;
  due_within_7_days: number;
  high_risk_overdue_count: number;
  stale_status_count: number;
  deadlines_without_active_owner: number;
  by_priority: Record<string, number>;
  by_deadline_type: Record<string, number>;
};

export function getDeadlines(params = "") {
  return apiFetch<Deadline[]>(`/api/v1/compliance/deadlines${params}`);
}

export function getDeadlineSummary() {
  return apiFetch<DeadlineSummary>("/api/v1/compliance/deadlines/summary");
}

// ── GET /api/v1/compliance/issues + /dashboard ──────────────────────────────
export type Issue = {
  id: string;
  title: string;
  description: string | null;
  issue_type: string;
  severity: string;
  status: string;
  source_type: string | null;
  owner_id: string | null;
  assigned_to: string | null;
  created_at?: string;
};

export type IssueDashboard = {
  total: number;
  by_status: Record<string, number>;
  by_severity: Record<string, number>;
  by_type: Record<string, number>;
  open_critical_count: number;
  avg_time_to_resolve_hours: number;
  unassigned_count: number;
  overdue_count: number;
};

export function getIssues() {
  return apiFetch<Issue[]>("/api/v1/compliance/issues");
}

export function getIssueDashboard() {
  return apiFetch<IssueDashboard>("/api/v1/compliance/issues/dashboard");
}

// ── GET /api/v1/compliance/dashboard/risk-heatmap ───────────────────────────
export type HeatmapCell = {
  likelihood: number;
  impact: number;
  count: number;
  risks: { id: string; title: string }[];
};

export function getRiskHeatmap() {
  return apiFetch<{ risk_heatmap: HeatmapCell[] }>("/api/v1/compliance/dashboard/risk-heatmap");
}
