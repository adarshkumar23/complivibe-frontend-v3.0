import { apiFetch } from "@/lib/api/client";

/**
 * Evidence API — typed against the live backend schema (/api/v1/evidence*).
 */

// ── GET /api/v1/evidence ────────────────────────────────────────────────────
export type Evidence = {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string | null;
  evidence_type: string | null;
  source: string | null;
  status: string;
  review_status: string;
  freshness_status: string | null;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  external_reference_url: string | null;
  valid_from: string | null;
  valid_until: string | null;
  collected_at: string | null;
};

export function getEvidence(params = "?limit=100") {
  return apiFetch<Evidence[]>(`/api/v1/evidence${params}`);
}

// ── GET /api/v1/evidence/readiness/summary ──────────────────────────────────
export type EvidenceReadinessSummary = {
  total_evidence_items: number;
  verified_evidence_items: number;
  needs_review_evidence_items: number;
  rejected_evidence_items: number;
  expired_evidence_items: number;
  controls_with_verified_evidence: number;
  controls_without_evidence: number;
  controls_with_expired_evidence: number;
};

export function getEvidenceReadinessSummary() {
  return apiFetch<EvidenceReadinessSummary>("/api/v1/evidence/readiness/summary");
}

// ── GET /api/v1/evidence/readiness/gaps ─────────────────────────────────────
export type EvidenceReadinessGap = {
  control_id?: string | null;
  control_title?: string | null;
  gap_type?: string | null;
  [key: string]: unknown;
};

export function getEvidenceReadinessGaps(limit = 20) {
  return apiFetch<EvidenceReadinessGap[]>(`/api/v1/evidence/readiness/gaps?limit=${limit}`);
}
