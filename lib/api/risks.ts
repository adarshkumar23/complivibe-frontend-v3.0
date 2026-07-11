import { apiFetch } from "@/lib/api/client";

/**
 * Risk domain API — typed against the live backend schema (/api/v1/risks*).
 */

// ── GET /api/v1/risks ───────────────────────────────────────────────────────
export type Risk = {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  severity: string | null;
  likelihood: number | null;
  impact: number | null;
  inherent_score: number | null;
  residual_likelihood: number | null;
  residual_impact: number | null;
  residual_score: number | null;
  composite_score_method: string | null;
  treatment_strategy: string | null;
  treatment_option: string | null;
  residual_risk_acceptable: boolean | null;
  owner_user_id: string | null;
  target_date: string | null;
};

export function getRisks(params = "?limit=100") {
  return apiFetch<Risk[]>(`/api/v1/risks${params}`);
}

// ── GET /api/v1/risks/summary ───────────────────────────────────────────────
export type RiskSummary = {
  total_risks: number;
  open_risks: number;
  accepted_risks: number;
  mitigated_risks: number;
  critical_risks: number;
  high_risks: number;
  medium_risks: number;
  low_risks: number;
  risks_without_controls: number;
  risks_without_owner: number;
  overdue_risk_reviews: number;
};

export function getRiskSummary() {
  return apiFetch<RiskSummary>("/api/v1/risks/summary");
}

// ── GET /api/v1/risks/heatmap ───────────────────────────────────────────────
export type RiskHeatmapCell = {
  likelihood: number;
  impact: number;
  count: number;
  risks: { id: string; title: string }[];
};

export function getRiskHeatmap() {
  return apiFetch<{ matrix: RiskHeatmapCell[] }>("/api/v1/risks/heatmap");
}
