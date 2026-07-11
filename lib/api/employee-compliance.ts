import { apiFetch } from "@/lib/api/client";

/**
 * Employee compliance API — typed against the live backend schema
 * (/api/v1/training-analytics/*, /api/v1/compliance/attestation-campaigns/*).
 */

// ── GET /api/v1/training-analytics/summary ──────────────────────────────────
export type TrainingSummary = {
  total_assigned: number;
  total_completed: number;
  overall_completion_rate: number;
  overall_overdue_count: number;
  overall_overdue_rate: number;
  trending_threshold_note?: string | null;
  [key: string]: unknown;
};

export function getTrainingSummary() {
  return apiFetch<TrainingSummary>("/api/v1/training-analytics/summary");
}

// ── GET /api/v1/training-analytics/records ──────────────────────────────────
export type TrainingRecord = {
  id: string;
  training_type?: string | null;
  completed?: boolean | null;
  due_date?: string | null;
  user_id?: string | null;
  [key: string]: unknown;
};

export function getTrainingRecords(params = "") {
  return apiFetch<TrainingRecord[]>(`/api/v1/training-analytics/records${params}`);
}

// ── GET /api/v1/compliance/attestation-campaigns + /dashboard ───────────────
export type AttestationDashboard = {
  active_campaigns: number;
  overdue_campaigns: number;
  overall_completion_rate: number;
  pending_attestations_count: number;
  campaigns_expiring_soon: unknown[];
};

export function getAttestationDashboard() {
  return apiFetch<AttestationDashboard>("/api/v1/compliance/attestation-campaigns/dashboard");
}

export type AttestationCampaign = {
  id: string;
  title?: string | null;
  status?: string | null;
  due_date?: string | null;
  [key: string]: unknown;
};

export function getAttestationCampaigns() {
  return apiFetch<AttestationCampaign[] | { items: AttestationCampaign[] }>(
    "/api/v1/compliance/attestation-campaigns"
  );
}
