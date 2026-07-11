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
