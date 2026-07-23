import { apiFetch } from "@/lib/api/client";

/**
 * Key Risk Indicators (KRI) + Risk Appetite domain API — typed against the live
 * backend schema (/api/v1/compliance/risk-indicators* and
 * /api/v1/compliance/risk-appetite*). This whole route is feature-gated by
 * "advanced_analytics" (Category C) at the dashboard-layout RouteFeatureGuard.
 */

// ─────────────────────────────────────────────────────────────────────────────
// KRI — Key Risk Indicators
// ─────────────────────────────────────────────────────────────────────────────

export const KRI_METRIC_TYPES = [
  "control_expiry_rate",
  "evidence_gap_rate",
  "overdue_task_rate",
  "vendor_high_risk_count",
  "open_alert_count",
  "policy_overdue_review",
  "custom"
] as const;
export type KriMetricType = (typeof KRI_METRIC_TYPES)[number];

/** Backend status enum — NOT normal/warning/critical. */
export const KRI_STATUSES = ["green", "amber", "red", "not_calculated"] as const;
export type KriStatus = (typeof KRI_STATUSES)[number];

export type RiskIndicatorRead = {
  id: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
  name: string;
  description: string | null;
  metric_type: KriMetricType;
  target_value: number;
  warning_threshold: number;
  critical_threshold: number;
  current_value: number | null;
  status: KriStatus;
  owner_user_id: string | null;
  linked_risk_id: string | null;
  last_calculated_at: string | null;
  notes: string | null;
  is_active: boolean;
  stale: boolean;
  breach_detail: Record<string, unknown> | null;
};

export type KriSummary = {
  total_indicators: number;
  by_status: {
    green: number;
    amber: number;
    red: number;
    not_calculated: number;
  };
  by_metric_type: Record<string, number>;
  critical_count: number;
  warning_count: number;
  last_calculated_at: string | null;
};

export type KriCreatePayload = {
  name: string;
  description?: string | null;
  metric_type: KriMetricType;
  target_value: number;
  warning_threshold: number;
  critical_threshold: number;
  owner_user_id: string;
  linked_risk_id?: string | null;
  notes?: string | null;
};

/** GET /api/v1/compliance/risk-indicators?is_active=true */
export function getRiskIndicators() {
  return apiFetch<RiskIndicatorRead[]>("/api/v1/compliance/risk-indicators?is_active=true");
}

/** GET /api/v1/compliance/risk-indicators/summary */
export function getKriSummary() {
  return apiFetch<KriSummary>("/api/v1/compliance/risk-indicators/summary");
}

/**
 * POST /api/v1/compliance/risk-indicators — perm risk_indicators:write.
 * Backend rejects with 400 unless warning_threshold < critical_threshold.
 */
export function createRiskIndicator(payload: KriCreatePayload) {
  return apiFetch<RiskIndicatorRead>("/api/v1/compliance/risk-indicators", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

/**
 * POST /api/v1/compliance/risk-indicators/{id}/recalculate — perm
 * risk_indicators:write. Recomputes current_value + status.
 */
export function recalculateRiskIndicator(id: string) {
  return apiFetch<RiskIndicatorRead>(`/api/v1/compliance/risk-indicators/${id}/recalculate`, {
    method: "POST"
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Risk Appetite thresholds
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Closed enum of exactly the 7 categories the backend accepts (server rejects
 * anything else with 422).
 *
 * KNOWN DESIGN GAP: risk.category is free-form, but appetite thresholds are keyed
 * to these 7 categories only. On the backend, any risk whose category isn't one
 * of these is silently governed by the "operational" threshold. The UI surfaces
 * this fallback honestly rather than hiding it (see AppetiteThresholdsSection note
 * and the breach rows, which show a risk's REAL category when it differs from the
 * threshold category it was evaluated against).
 */
export const RISK_APPETITE_CATEGORIES = [
  "operational",
  "financial",
  "compliance",
  "reputational",
  "technology",
  "vendor",
  "ai_governance"
] as const;
export type RiskAppetiteCategory = (typeof RISK_APPETITE_CATEGORIES)[number];

export type RiskAppetiteThresholdRead = {
  id: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
  scope_type: "org" | "business_unit";
  scope_id: string | null;
  risk_category: string;
  max_acceptable_score: number;
  escalation_owner_id: string | null;
  is_active: boolean;
  notes: string | null;
  created_by_user_id: string | null;
};

export type AppetiteSummary = {
  total_thresholds: number;
  active_thresholds: number;
  by_category: Record<string, number>;
  breach_count: number;
  categories_without_threshold: string[];
};

export type AppetiteBreach = {
  alert_id: string;
  status: string;
  severity: string;
  title: string;
  threshold_id: string;
  risk_category: string;
  new_score: number;
  max_acceptable_score: number;
  risk: { id: string; name: string; score: number; category: string } | null;
  created_at: string;
};

export type AppetiteThresholdCreatePayload = {
  scope_type: "org";
  scope_id: null;
  risk_category: RiskAppetiteCategory;
  max_acceptable_score: number;
  escalation_owner_id: string;
  notes?: string | null;
};

/** GET /api/v1/compliance/risk-appetite?is_active=true */
export function getAppetiteThresholds() {
  return apiFetch<RiskAppetiteThresholdRead[]>("/api/v1/compliance/risk-appetite?is_active=true");
}

/** GET /api/v1/compliance/risk-appetite/summary */
export function getAppetiteSummary() {
  return apiFetch<AppetiteSummary>("/api/v1/compliance/risk-appetite/summary");
}

/** GET /api/v1/compliance/risk-appetite/breaches */
export function getAppetiteBreaches() {
  return apiFetch<AppetiteBreach[]>("/api/v1/compliance/risk-appetite/breaches");
}

/**
 * POST /api/v1/compliance/risk-appetite — perm risk_appetite:write.
 * We keep scope simple (org-wide, scope_id null); a "business_unit" scope would
 * require a scope_id the backend enforces.
 */
export function createAppetiteThreshold(payload: AppetiteThresholdCreatePayload) {
  return apiFetch<RiskAppetiteThresholdRead>("/api/v1/compliance/risk-appetite", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
