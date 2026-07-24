import { apiFetch } from "@/lib/api/client";

/**
 * Controls domain API — typed against the live backend schema
 * (/api/v1/controls*, /api/v1/control-tests*).
 */

// ── GET /api/v1/controls ────────────────────────────────────────────────────
export type Control = {
  id: string;
  title: string;
  description: string | null;
  control_code: string | null;
  control_type: string | null;
  status: string;
  criticality: string | null;
  owner_user_id: string | null;
  last_reviewed_at: string | null;
  testing_procedure: string | null;
  implementation_notes: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
  owner_membership_active?: boolean | null;
};

export function getControls(params = "?limit=100") {
  return apiFetch<Control[]>(`/api/v1/controls${params}`);
}

// ── POST /api/v1/controls ───────────────────────────────────────────────────
export const CONTROL_TYPES = [
  "policy",
  "technical",
  "administrative",
  "process",
  "ai_governance",
  "vendor",
  "privacy",
  "security"
] as const;

export const CONTROL_CRITICALITIES = ["low", "medium", "high", "critical"] as const;

export type ControlCreateInput = {
  title: string;
  description?: string | null;
  control_code?: string | null;
  control_type: (typeof CONTROL_TYPES)[number];
  criticality: (typeof CONTROL_CRITICALITIES)[number];
  owner_user_id?: string | null;
  testing_procedure?: string | null;
  implementation_notes?: string | null;
};

export function createControl(body: ControlCreateInput) {
  return apiFetch<Control>("/api/v1/controls", { method: "POST", body: JSON.stringify(body) });
}

// ── PATCH /api/v1/controls/{id} (edit) + /archive (retire) ──────────────────
export const CONTROL_STATUSES = [
  "not_started",
  "in_progress",
  "implemented",
  "needs_review",
  "failed",
  "not_applicable"
] as const;

export type ControlUpdateInput = {
  title?: string;
  description?: string | null;
  status?: (typeof CONTROL_STATUSES)[number];
  criticality?: (typeof CONTROL_CRITICALITIES)[number];
  owner_user_id?: string | null;
  testing_procedure?: string | null;
  implementation_notes?: string | null;
};

export function updateControl(controlId: string, body: ControlUpdateInput) {
  return apiFetch<Control>(`/api/v1/controls/${controlId}`, { method: "PATCH", body: JSON.stringify(body) });
}

/** PATCH /api/v1/controls/{id}/archive — retires the control (status -> archived).
 * The product has no hard-delete for controls (archive-only, audit trail). */
export function archiveControl(controlId: string) {
  return apiFetch<Control>(`/api/v1/controls/${controlId}/archive`, { method: "PATCH" });
}

// ── POST /api/v1/controls/{control_id}/obligations ──────────────────────────
export const OBLIGATION_MAPPING_TYPES = ["satisfies", "partially_satisfies", "supports", "related"] as const;

export type ControlObligationMapInput = {
  obligation_id: string;
  mapping_type: (typeof OBLIGATION_MAPPING_TYPES)[number];
  /** manual_confirmed | system_suggested | imported | low_confidence (defaults to manual_confirmed) */
  confidence?: string;
  rationale?: string | null;
};

export type ControlObligationMap = {
  obligation_id: string;
  mapping_type: string;
  confidence: string;
  status: string;
};

export function mapControlToObligation(controlId: string, body: ControlObligationMapInput) {
  return apiFetch<ControlObligationMap>(`/api/v1/controls/${controlId}/obligations`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

// ── GET /api/v1/obligations/{obligation_id}/controls ────────────────────────
export function getControlsForObligation(obligationId: string) {
  return apiFetch<Control[]>(`/api/v1/obligations/${obligationId}/controls`);
}

// ── GET /api/v1/reports/framework-coverage-matrix?framework_id= ─────────────
export type CoverageMatrixObligation = {
  obligation_id: string;
  reference: string;
  title: string;
  controls_count: number;
  evidence_count: number;
  coverage_status: string; // "covered" | "partial" | "uncovered"
};

export type FrameworkCoverageMatrix = {
  framework_id: string;
  framework_name: string;
  total_obligations: number;
  covered: number;
  partial: number;
  uncovered: number;
  coverage_pct: number;
  sections: { section_title: string; obligations: CoverageMatrixObligation[] }[];
};

export function getFrameworkCoverageMatrix(frameworkId: string) {
  return apiFetch<FrameworkCoverageMatrix>(
    `/api/v1/reports/framework-coverage-matrix?framework_id=${encodeURIComponent(frameworkId)}`
  );
}

// ── POST /api/v1/compliance/policies/{policy_id}/links/controls ─────────────
export type PolicyControlLink = {
  id: string;
  organization_id: string;
  policy_id: string;
  control_id: string;
  link_reason: string | null;
  status: string;
  linked_by_user_id: string;
  created_at: string;
};

export function linkControlToPolicy(policyId: string, body: { control_id: string; link_reason?: string | null }) {
  return apiFetch<PolicyControlLink>(`/api/v1/compliance/policies/${policyId}/links/controls`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

// ── GET /api/v1/controls/gaps/summary ───────────────────────────────────────
export type ControlGapsSummary = {
  total_active_obligations: number;
  obligations_with_controls: number;
  obligations_without_controls: number;
  controls_not_started: number;
  controls_in_progress: number;
  controls_implemented: number;
  high_criticality_open_controls: number;
};

export function getControlGapsSummary() {
  return apiFetch<ControlGapsSummary>("/api/v1/controls/gaps/summary");
}

// ── GET /api/v1/control-tests/summary ───────────────────────────────────────
export type ControlTestsSummary = {
  active_tests: number;
  tests_due: number;
  tests_overdue: number;
  latest_passed: number;
  latest_failed: number;
  latest_needs_review: number;
  controls_without_tests: number;
};

export function getControlTestsSummary() {
  return apiFetch<ControlTestsSummary>("/api/v1/control-tests/summary");
}
