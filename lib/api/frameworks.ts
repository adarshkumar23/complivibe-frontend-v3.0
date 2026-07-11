import { apiFetch } from "@/lib/api/client";

/**
 * Framework & obligation catalog API — typed against the live backend schema
 * (/api/v1/frameworks/*, /api/v1/obligations/*).
 */

// ── GET /api/v1/frameworks ──────────────────────────────────────────────────
export type Framework = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  jurisdiction: string | null;
  authority: string | null;
  version: string | null;
  status: string | null;
  coverage_level: string | null;
  effective_date: string | null;
  total_obligation_count: number | null;
  active_obligation_count: number | null;
  is_currently_effective: boolean | null;
  staleness_days: number | null;
  context_flags: string[] | null;
};

export function getFrameworkCatalog() {
  return apiFetch<Framework[]>("/api/v1/frameworks");
}

// ── GET /api/v1/frameworks/active ───────────────────────────────────────────
export type ActiveFramework = {
  id: string;
  organization_id: string;
  framework_id: string;
  status: string;
  activated_at: string | null;
  notes: string | null;
  framework: Framework;
  total_obligation_count: number | null;
  active_obligation_count: number | null;
  activation_outdated: boolean | null;
  context_flags: string[] | null;
};

export function getActiveFrameworks() {
  return apiFetch<ActiveFramework[]>("/api/v1/frameworks/active");
}

export function activateFramework(frameworkId: string, notes?: string) {
  return apiFetch<unknown>(`/api/v1/frameworks/${frameworkId}/activate`, {
    method: "POST",
    body: JSON.stringify({ notes: notes ?? null })
  });
}

export function deactivateFramework(frameworkId: string, notes?: string) {
  return apiFetch<unknown>(`/api/v1/frameworks/${frameworkId}/deactivate`, {
    method: "POST",
    body: JSON.stringify({ notes: notes ?? null })
  });
}

// ── GET /api/v1/frameworks/{id}/obligations ─────────────────────────────────
export type ObligationState = {
  applicability_status: string | null;
  implementation_status: string | null;
  owner_user_id: string | null;
  justification: string | null;
};

export type Obligation = {
  id: string;
  framework_id: string;
  reference_code: string | null;
  title: string;
  description: string | null;
  plain_language_summary: string | null;
  obligation_type: string | null;
  jurisdiction: string | null;
  status: string | null;
  effective_date: string | null;
  organization_state: ObligationState | null;
  coverage_level: string | null;
  review_status: string | null;
};

export function getFrameworkObligations(frameworkId: string) {
  return apiFetch<Obligation[]>(`/api/v1/frameworks/${frameworkId}/obligations`);
}

// ── GET /api/v1/frameworks/{id}/applicability/summary ───────────────────────
export type ApplicabilitySummary = {
  total_questions: number;
  answered_questions: number;
  unanswered_questions: number;
  required_questions_count: number;
  answered_required_questions: number;
  unanswered_required_questions: number;
  answer_completion_pct: number;
  total_obligations: number;
  applicable_obligations: number;
  not_applicable_obligations: number;
  needs_review_obligations: number;
  unknown_obligations: number;
  latest_evaluation_at: string | null;
  stale_answers_count: number;
  answers_stale_since_latest_change: boolean;
  caveat: string | null;
};

export function getApplicabilitySummary(frameworkId: string) {
  return apiFetch<ApplicabilitySummary>(`/api/v1/frameworks/${frameworkId}/applicability/summary`);
}

// ── PATCH /api/v1/obligations/{id}/state ────────────────────────────────────
export function updateObligationState(
  obligationId: string,
  body: {
    applicability_status?: string;
    implementation_status?: string;
    owner_user_id?: string;
    justification?: string;
  }
) {
  return apiFetch<unknown>(`/api/v1/obligations/${obligationId}/state`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}
