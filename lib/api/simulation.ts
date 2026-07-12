import { apiFetch } from "@/lib/api/client";

/**
 * Real simulation surfaces exposed by the backend. There is no general "what-if
 * scenario" engine — only these two narrow, unrelated deterministic simulators:
 *
 * 1. Guardrail policy-resolution simulation
 *    POST /api/v1/ai-governance/guardrails/policy-resolution/simulate
 *    Given hypothetical AI-governance contexts (AI systems, review types, rollout
 *    class), replays the deterministic guardrail policy-resolution precedence logic
 *    and reports which guardrail policy (if any) would apply and whether it would
 *    block/warn — without creating reviews, sequence runs, or policy changes.
 *
 * 2. Reviewer-capacity policy simulation
 *    POST /api/v1/framework-review-capacity/simulations/policy
 *    Given a hypothetical reviewer-capacity policy (max active/overdue assignments,
 *    preferred review types/coverage levels), recomputes every active reviewer's
 *    deterministic workload score under that policy and compares it to their
 *    current score — without persisting the policy or changing any assignment.
 */

// ── 1. Guardrail policy-resolution simulation ───────────────────────────────

export const GUARDRAIL_REVIEW_TYPES = [
  "initial_review",
  "pre_production_review",
  "periodic_review",
  "change_review",
  "retirement_review"
] as const;

export type GuardrailReviewType = (typeof GUARDRAIL_REVIEW_TYPES)[number];

export type PolicyResolutionSimulationContext = {
  context_key?: string | null;
  explicit_policy_set_id?: string | null;
  sequence_pack_id?: string | null;
  ai_system_ids?: string[] | null;
  review_types?: GuardrailReviewType[] | null;
  rollout_class?: string | null;
  planned_start?: string | null;
  planned_end?: string | null;
};

export type PolicyResolutionSimulationRequest = {
  title?: string | null;
  description?: string | null;
  persist_report: boolean;
  contexts: PolicyResolutionSimulationContext[];
};

export type PolicyResolutionSimulationContextResult = {
  context_key: string | null;
  policy_resolution: {
    resolved_policy_set_id: string | null;
    resolved_policy_version_id: string | null;
    resolution_source: string;
    assignment_id: string | null;
    precedence_trace: Record<string, unknown>[];
    caveat: string;
  };
  guardrail_resolution: {
    blocked: boolean;
    resolution: {
      blocked: boolean;
      primary_blocking_window_id: string | null;
      override_allowed: boolean;
      enforcement_level: string;
      precedence_order: unknown[];
      matching_window_count: number;
      warnings: unknown[];
      info: unknown[];
    };
    warnings: unknown[];
  };
  precedence_trace: Record<string, unknown>[];
  caveat: string;
};

export type PolicyResolutionSimulationResponse = {
  persisted: boolean;
  report_id: string | null;
  context_count: number;
  blocked_contexts_count: number;
  warning_contexts_count: number;
  no_policy_contexts_count: number;
  contexts: PolicyResolutionSimulationContextResult[];
  caveat: string;
};

export function simulatePolicyResolution(body: PolicyResolutionSimulationRequest) {
  return apiFetch<PolicyResolutionSimulationResponse>("/api/v1/ai-governance/guardrails/policy-resolution/simulate", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

// ── 2. Reviewer-capacity policy simulation ───────────────────────────────────

export type ReviewerCapacitySimulationRequest = {
  role_name?: string | null;
  max_active_assignments: number;
  max_overdue_assignments: number;
  preferred_review_types_json?: string[] | null;
  preferred_target_coverage_levels_json?: string[] | null;
  review_type?: string | null;
  target_coverage_level?: string | null;
};

export type ReviewerCapacitySimulationSummary = {
  active_reviewers: number;
  overloaded_reviewers: number;
  reviewers_with_overdue_assignments: number;
  total_open_assignments: number;
  total_open_escalations: number;
  average_workload_score: number;
};

export type ReviewerCapacitySimulationComparison = {
  user_id: string;
  role_name: string;
  current_workload_score: number;
  simulated_workload_score: number;
  delta: number;
  reason: string;
  current_capacity_remaining: number | null;
  simulated_capacity_remaining: number | null;
  active_assignments: number;
  overdue_assignments: number;
  open_escalations: number;
  current_scoring_json: Record<string, unknown>;
  simulated_scoring_json: Record<string, unknown>;
  provenance: string;
};

export type ReviewerCapacitySimulationResponse = {
  current_summary: ReviewerCapacitySimulationSummary;
  simulated_summary: ReviewerCapacitySimulationSummary;
  reviewer_comparisons: ReviewerCapacitySimulationComparison[];
  scoring_formula: Record<string, unknown>;
  provenance: string;
  caveat: string;
};

export function simulateReviewerCapacityPolicy(body: ReviewerCapacitySimulationRequest) {
  return apiFetch<ReviewerCapacitySimulationResponse>("/api/v1/framework-review-capacity/simulations/policy", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

// ── Context data used to populate the guardrail-simulation form ─────────────

export type ReviewerWorkloadSnapshot = {
  user_id: string;
  role_name: string;
  active_assignments: number;
  overdue_assignments: number;
  open_escalations: number;
  workload_score: number;
};

export function getReviewerWorkload() {
  return apiFetch<ReviewerWorkloadSnapshot[]>("/api/v1/framework-review-capacity/workload");
}
