import { apiFetch } from "@/lib/api/client";

/**
 * Scoring API — typed against the live backend schema (/api/v1/scoring/*).
 * Deterministic readiness/health scores derived only from backend records.
 */

// ── GET /api/v1/scoring/snapshots/latest (ScoreLatestResponse) ───────────────
export type ScoreSnapshot = {
  id: string;
  organization_id: string;
  snapshot_type: string;
  score: number;
  grade: string;
  /** raw counters the formula consumed (e.g. active_controls, implemented_controls) */
  inputs_json: Record<string, unknown>;
  /** per-component ratios/weights + the formula applied */
  breakdown_json: Record<string, unknown>;
  recommendations_json: string[] | null;
  calculated_at: string;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export function getLatestScoreSnapshots() {
  return apiFetch<{ snapshots: ScoreSnapshot[] }>("/api/v1/scoring/snapshots/latest");
}

// ── POST /api/v1/scoring/snapshots/materialize ───────────────────────────────
export function materializeScoreSnapshots() {
  return apiFetch<{ dry_run: boolean; snapshots: ScoreSnapshot[] }>("/api/v1/scoring/snapshots/materialize", {
    method: "POST",
    body: JSON.stringify({})
  });
}

// ── GET /api/v1/scoring/snapshots/trends ─────────────────────────────────────
export type ScoreTrendPoint = { calculated_at: string; score: number; grade: string };
export type ScoreTrends = {
  days: number;
  series: { snapshot_type: string; points: ScoreTrendPoint[] }[];
};

export function getScoreTrends(days = 30) {
  return apiFetch<ScoreTrends>(`/api/v1/scoring/snapshots/trends?days=${days}`);
}

// ── GET /api/v1/scoring/methodology ──────────────────────────────────────────
export type ScoreMethodology = {
  snapshot_types: Record<string, { formula?: string; notes?: string }>;
  caveats: string[];
};

export function getScoreMethodology() {
  return apiFetch<ScoreMethodology>("/api/v1/scoring/methodology");
}
