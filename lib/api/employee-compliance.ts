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

// ── POST /api/v1/compliance/attestation-campaigns ───────────────────────────
export type AttestationCampaignCreatePayload = {
  policy_id: string;
  title: string;
  due_date: string; // date
  description?: string | null;
  attestation_text?: string | null;
};

/** The create returns an AttestationSummaryResponse wrapping the new campaign. */
export type AttestationCampaignSummary = {
  campaign: AttestationCampaign;
  total_members: number;
  attested_count: number;
  declined_count: number;
  pending_count: number;
  completion_pct: number;
};

export function createAttestationCampaign(payload: AttestationCampaignCreatePayload) {
  return apiFetch<AttestationCampaignSummary>("/api/v1/compliance/attestation-campaigns", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// ── POST /api/v1/training-analytics/records (TrainingCompletionRecordCreate) ─
export type TrainingRecordCreatePayload = {
  user_id: string;
  training_type: string;
  due_date: string; // date-time
  business_unit_id?: string | null;
  assigned_at?: string | null;
  score?: number | null;
};

export function createTrainingRecord(payload: TrainingRecordCreatePayload) {
  return apiFetch<TrainingRecord>("/api/v1/training-analytics/records", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
