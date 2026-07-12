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

// ── /api/v1/compliance/issues (+ /dashboard, lifecycle) ─────────────────────
// Router: app/api/v1/issues.py. Status changes always go through the single
// POST /{issue_id}/transition endpoint — ALLOWED_TRANSITIONS is a strict,
// one-step-forward chain (issue_service.py:22-27):
//   open -> investigating -> mitigating -> resolved -> closed
// resolved -> closed additionally requires a non-empty resolution_note.
export const ISSUE_TYPES = [
  "security_incident",
  "compliance_violation",
  "operational_failure",
  "vendor_failure",
  "data_loss",
  "unauthorized_access",
  "policy_violation",
  "custom"
] as const;
export const ISSUE_SEVERITIES = ["critical", "high", "medium", "low"] as const;
export const ISSUE_SOURCE_TYPES = [
  "manual",
  "monitoring_alert",
  "audit_finding",
  "vendor_assessment",
  "external_report",
  "data_incident",
  "risk_assessment"
] as const;
export const ISSUE_STATUSES = ["open", "investigating", "mitigating", "resolved", "closed"] as const;

export const ISSUE_ALLOWED_NEXT_STATUS: Record<string, string | null> = {
  open: "investigating",
  investigating: "mitigating",
  mitigating: "resolved",
  resolved: "closed",
  closed: null
};

export type IssueInsight = {
  hours_open: number;
  response_sla_hours: number;
  resolution_sla_hours: number;
  response_breached: boolean | null;
  resolution_breached: boolean | null;
  response_remaining_hours: number | null;
  resolution_remaining_hours: number | null;
  rca_status: string;
};

export type Issue = {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  issue_type: string;
  severity: string;
  status: string;
  source_type: string | null;
  source_id: string | null;
  owner_id: string;
  assigned_to: string | null;
  created_by: string;
  resolution_note: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  insight: IssueInsight | null;
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

export type IssueCreate = {
  title: string;
  description: string;
  issue_type: string;
  severity: string;
  source_type?: string;
  owner_id: string;
  assigned_to?: string | null;
};

export function getIssues(params: { status?: string; severity?: string; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.severity) qs.set("severity", params.severity);
  qs.set("limit", String(params.limit ?? 100));
  return apiFetch<Issue[]>(`/api/v1/compliance/issues?${qs.toString()}`);
}

export function getIssueDashboard() {
  return apiFetch<IssueDashboard>("/api/v1/compliance/issues/dashboard");
}

export function createIssue(body: IssueCreate) {
  return apiFetch<Issue>("/api/v1/compliance/issues", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function transitionIssue(issueId: string, newStatus: string, opts: { notes?: string; resolutionNote?: string } = {}) {
  return apiFetch<Issue>(`/api/v1/compliance/issues/${issueId}/transition`, {
    method: "POST",
    body: JSON.stringify({
      new_status: newStatus,
      notes: opts.notes ?? null,
      resolution_note: opts.resolutionNote ?? null
    })
  });
}

export function assignIssue(issueId: string, assignedTo: string) {
  return apiFetch<Issue>(`/api/v1/compliance/issues/${issueId}/assign`, {
    method: "POST",
    body: JSON.stringify({ assigned_to: assignedTo })
  });
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
