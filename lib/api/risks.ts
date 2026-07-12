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

/**
 * Allowed values, taken from the live backend schema (reports/live-openapi.json):
 * - likelihood / impact: integer 1–5 (RiskCreate/RiskUpdate min 1, max 5).
 * - status: RiskUpdate pattern ^(identified|assessing|treatment_planned|in_treatment|accepted|mitigated|monitored|archived)$
 * - treatment_strategy: pattern ^(mitigate|accept|transfer|avoid|undecided)$
 * - category: free string in the schema (default "other"); the backend's formally
 *   recognised category set is ALL_RISK_CATEGORIES in app/api/v1/risk_appetite.py
 *   (operational, financial, compliance, reputational, technology, vendor,
 *   ai_governance) — offered here plus the schema default "other".
 */
export const RISK_SCALE = [1, 2, 3, 4, 5] as const;

export const RISK_STATUSES = [
  "identified",
  "assessing",
  "treatment_planned",
  "in_treatment",
  "accepted",
  "mitigated",
  "monitored",
  "archived"
] as const;
export type RiskStatus = (typeof RISK_STATUSES)[number];

export const TREATMENT_STRATEGIES = ["mitigate", "accept", "transfer", "avoid", "undecided"] as const;
export type TreatmentStrategy = (typeof TREATMENT_STRATEGIES)[number];

export const RISK_CATEGORIES = [
  "operational",
  "financial",
  "compliance",
  "reputational",
  "technology",
  "vendor",
  "ai_governance",
  "other"
] as const;

// ── POST /api/v1/risks (RiskCreate) ─────────────────────────────────────────
export type RiskCreatePayload = {
  title: string;
  description?: string | null;
  category?: string;
  likelihood: number;
  impact: number;
  treatment_strategy?: TreatmentStrategy;
  owner_user_id?: string | null;
};

export function createRisk(payload: RiskCreatePayload) {
  return apiFetch<Risk>("/api/v1/risks", { method: "POST", body: JSON.stringify(payload) });
}

// ── PATCH /api/v1/risks/{risk_id} (RiskUpdate — partial, send only changes) ─
export type RiskUpdatePayload = Partial<{
  title: string;
  description: string | null;
  category: string;
  status: RiskStatus;
  likelihood: number;
  impact: number;
  treatment_strategy: TreatmentStrategy;
  owner_user_id: string | null;
}>;

export function updateRisk(riskId: string, payload: RiskUpdatePayload) {
  return apiFetch<Risk>(`/api/v1/risks/${riskId}`, { method: "PATCH", body: JSON.stringify(payload) });
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
