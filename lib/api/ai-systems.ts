import { apiFetch } from "@/lib/api/client";

/**
 * AI systems + AI governance API — typed against the live backend schema
 * (/api/v1/ai-systems*, /api/v1/ai-governance/*).
 */

// ── GET /api/v1/ai-systems ──────────────────────────────────────────────────
export type AiSystem = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  system_type: string;
  lifecycle_status: string;
  deployment_environment: string | null;
  business_owner_user_id: string | null;
  technical_owner_user_id: string | null;
  vendor_name: string | null;
  provider_name: string | null;
  model_name: string | null;
  model_version: string | null;
  intended_purpose: string | null;
  use_case: string | null;
  tags_json: string[] | null;
  archived_at: string | null;
};

export function getAiSystems(params = "") {
  return apiFetch<AiSystem[]>(`/api/v1/ai-systems${params}`);
}

// ── POST /api/v1/ai-systems + PATCH /api/v1/ai-systems/{id} ─────────────────
export const AI_SYSTEM_TYPES = [
  "internal_model",
  "third_party_model",
  "ai_feature",
  "agent",
  "workflow_automation",
  "other"
] as const;

export const AI_LIFECYCLE_STATUSES = [
  "proposed",
  "in_development",
  "testing",
  "production",
  "retired",
  "archived"
] as const;

export type AiSystemCreate = {
  name: string;
  system_type: (typeof AI_SYSTEM_TYPES)[number];
  lifecycle_status?: (typeof AI_LIFECYCLE_STATUSES)[number];
  description?: string | null;
  deployment_environment?: string | null;
  vendor_name?: string | null;
  provider_name?: string | null;
  model_name?: string | null;
  model_version?: string | null;
  intended_purpose?: string | null;
  use_case?: string | null;
};

export type AiSystemUpdate = Partial<AiSystemCreate>;

export function createAiSystem(body: AiSystemCreate) {
  return apiFetch<AiSystem>("/api/v1/ai-systems", { method: "POST", body: JSON.stringify(body) });
}

export function updateAiSystem(id: string, body: AiSystemUpdate) {
  return apiFetch<AiSystem>(`/api/v1/ai-systems/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export function getAiSystem(id: string) {
  return apiFetch<AiSystem>(`/api/v1/ai-systems/${encodeURIComponent(id)}`);
}

// ── GET /api/v1/ai-systems/summary ──────────────────────────────────────────
export type AiSystemsSummary = {
  total_systems: number;
  active_systems: number;
  archived_systems: number;
  by_lifecycle_status: Record<string, number>;
  by_system_type: Record<string, number>;
  with_business_owner: number;
  with_technical_owner: number;
  missing_owner_count: number;
};

export function getAiSystemsSummary() {
  return apiFetch<AiSystemsSummary>("/api/v1/ai-systems/summary");
}

// ── GET /api/v1/ai-governance/dashboard ─────────────────────────────────────
export type AiGovernanceDashboard = {
  ai_systems_by_tier: Record<string, number>;
  governance_coverage_pct: number;
  outstanding_reviews_count: number;
  policy_violations_count: number;
  shadow_ai_detected_count: number;
  high_risk_systems_without_approval: number;
  monitoring_alerts_by_system: { system_id?: string; system_name?: string; alert_count?: number }[];
};

export function getAiGovernanceDashboard() {
  return apiFetch<AiGovernanceDashboard>("/api/v1/ai-governance/dashboard");
}

// ── GET /api/v1/ai-governance/scorecard ─────────────────────────────────────
export type AiGovernanceScorecard = {
  org_id: string;
  total_systems: number;
  scorecard: {
    avg_governance_score: number;
    bias_assessment_coverage: number;
    oversight_level_set: number;
    high_risk_no_oversight_count: number;
    with_governance_score: number;
  };
  alerts: unknown[];
};

export function getAiGovernanceScorecard() {
  return apiFetch<AiGovernanceScorecard>("/api/v1/ai-governance/scorecard");
}

// ── GET /api/v1/ai-governance/signals + /summary ────────────────────────────
export type AiSignal = {
  id: string;
  signal_type: string | null;
  severity: string | null;
  status: string | null;
  title?: string | null;
  summary?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

export function getAiSignals(params = "") {
  return apiFetch<AiSignal[]>(`/api/v1/ai-governance/signals${params}`);
}

export type AiSignalsSummary = {
  total_signals: number;
  open_signals: number;
  resolved_signals: number;
  dismissed_signals: number;
  by_severity: Record<string, number>;
  by_signal_type: Record<string, number>;
  by_entity_type: Record<string, number>;
  latest_signal_at: string | null;
  stale_open_signals: number;
  oldest_open_signal_age_days: number | null;
  open_critical_signals: number;
  open_high_or_urgent_priority_signals: number;
  context_flags: string[] | null;
};

export function getAiSignalsSummary() {
  return apiFetch<AiSignalsSummary>("/api/v1/ai-governance/signals/summary");
}

// ── GET /api/v1/ai-governance/events/summary ────────────────────────────────
export type AiEventsSummary = {
  total_events_30d: number;
  by_event_type: Record<string, number>;
  systems_with_most_events: { system_id?: string; system_name?: string; count?: number }[];
};

export function getAiEventsSummary() {
  return apiFetch<AiEventsSummary>("/api/v1/ai-governance/events/summary");
}

// ── GET /api/v1/ai-governance/ai-risk/assessments + /summary ────────────────
export type AiRiskAssessmentsSummary = {
  total_assessments: number;
  draft_assessments: number;
  in_review_assessments: number;
  completed_assessments: number;
  archived_assessments: number;
  by_risk_level: Record<string, number>;
  by_assessment_type: Record<string, number>;
  latest_completed_at: string | null;
  caveat: string | null;
};

export function getAiRiskAssessmentsSummary() {
  return apiFetch<AiRiskAssessmentsSummary>("/api/v1/ai-governance/ai-risk/assessments/summary");
}

export type AiRiskAssessment = {
  id: string;
  title?: string | null;
  assessment_type?: string | null;
  status?: string | null;
  risk_level?: string | null;
  ai_system_id?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

export function getAiRiskAssessments(params = "") {
  return apiFetch<AiRiskAssessment[]>(`/api/v1/ai-governance/ai-risk/assessments${params}`);
}

// ── POST /api/v1/ai-governance/ai-risk/assessments ──────────────────────────
export const ASSESSMENT_TYPES = [
  "initial",
  "periodic",
  "material_change",
  "incident_followup",
  "pre_deployment"
] as const;

export const ASSESSMENT_RISK_LEVELS = ["unknown", "low", "medium", "high", "critical"] as const;

export type AiRiskAssessmentCreate = {
  ai_system_id: string;
  title: string;
  assessment_type: (typeof ASSESSMENT_TYPES)[number];
  description?: string | null;
  status?: "draft" | "in_review" | "completed" | "archived";
  risk_level?: (typeof ASSESSMENT_RISK_LEVELS)[number];
  likelihood?: (typeof ASSESSMENT_RISK_LEVELS)[number];
  impact?: (typeof ASSESSMENT_RISK_LEVELS)[number];
  mitigation_summary?: string | null;
  assumptions?: string | null;
  limitations?: string | null;
};

export function createAiRiskAssessment(body: AiRiskAssessmentCreate) {
  return apiFetch<AiRiskAssessment>("/api/v1/ai-governance/ai-risk/assessments", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

// ── GET /api/v1/ai-governance/iso42001/summary ──────────────────────────────
export type Iso42001Summary = {
  total_clauses: number;
  by_status: Record<string, number>;
  implementation_pct: number;
  sections: Record<string, { total: number; implemented: number; pct: number }>;
};

export function getIso42001Summary() {
  return apiFetch<Iso42001Summary>("/api/v1/ai-governance/iso42001/summary");
}

// ── GET /api/v1/ai-governance/mlflow/drift ──────────────────────────────────
export type MlflowDriftEntry = {
  model_name?: string | null;
  metric?: string | null;
  drift_detected?: boolean | null;
  p_value?: number | null;
  [key: string]: unknown;
};

export function getMlflowDrift() {
  return apiFetch<MlflowDriftEntry[]>("/api/v1/ai-governance/mlflow/drift");
}

// ── GET /api/v1/organizations/mlflow-connection (404 when not configured) ───
export type MlflowConnection = {
  id: string;
  tracking_uri?: string | null;
  is_active?: boolean | null;
  [key: string]: unknown;
};

export function getMlflowConnection() {
  return apiFetch<MlflowConnection>("/api/v1/organizations/mlflow-connection");
}
