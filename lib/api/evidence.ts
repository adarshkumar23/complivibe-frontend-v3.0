import { apiFetch, apiUpload, ApiError } from "@/lib/api/client";

/**
 * Evidence API — typed against the live backend schema (/api/v1/evidence*).
 */

// Allowed evidence file upload types + max size, mirrored from the backend
// (_ALLOWED_EXTENSIONS + EVIDENCE_MAX_UPLOAD_BYTES) so the picker/validation match.
export const EVIDENCE_ALLOWED_EXTENSIONS = [
  ".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".tif", ".tiff",
  ".txt", ".csv", ".json", ".xml", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
] as const;
export const EVIDENCE_MAX_UPLOAD_BYTES = 26_214_400; // 25 MiB

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

// ── POST /api/v1/evidence (metadata-only create) ────────────────────────────
export type EvidenceCreateInput = {
  title: string;
  evidence_type?: string;
  description?: string | null;
  external_reference_url?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
};

export function createEvidence(body: EvidenceCreateInput) {
  return apiFetch<Evidence>("/api/v1/evidence", { method: "POST", body: JSON.stringify(body) });
}

// ── GET /api/v1/evidence/{id} (detail + linked controls) ────────────────────
export type EvidenceControlSummary = { control_id: string; title: string; status: string };
export type EvidenceDetail = Evidence & {
  checksum_sha256?: string | null;
  storage_provider?: string | null;
  storage_key?: string | null;
  reviewed_by_user_id?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
  uploaded_by_user_id?: string | null;
  linked_controls: EvidenceControlSummary[];
};

export function getEvidenceDetail(evidenceId: string) {
  return apiFetch<EvidenceDetail>(`/api/v1/evidence/${evidenceId}`);
}

// ── POST /api/v1/evidence/{id}/file (real multipart R2 upload) ──────────────
export type EvidenceFileUploadResponse = {
  evidence_id: string;
  storage_provider: string;
  storage_key: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  checksum_sha256: string;
};

export function uploadEvidenceFile(evidenceId: string, file: File) {
  const form = new FormData();
  form.append("file", file, file.name);
  return apiUpload<EvidenceFileUploadResponse>(`/api/v1/evidence/${evidenceId}/file`, form);
}

// ── GET /api/v1/evidence/{id}/file-url (short-lived signed GET URL) ─────────
export type EvidenceFileUrlResponse = { evidence_id: string; url: string; expires_in_seconds: number };

export function getEvidenceFileUrl(evidenceId: string) {
  return apiFetch<EvidenceFileUrlResponse>(`/api/v1/evidence/${evidenceId}/file-url`);
}

// ── POST/DELETE /api/v1/evidence/{id}/controls (link/unlink a control) ──────
export type EvidenceControlLink = {
  id: string;
  evidence_item_id: string;
  control_id: string;
  link_status: string;
  confidence: string;
  rationale: string | null;
};

export function linkEvidenceControl(evidenceId: string, controlId: string, rationale?: string) {
  return apiFetch<EvidenceControlLink>(`/api/v1/evidence/${evidenceId}/controls`, {
    method: "POST",
    body: JSON.stringify({ control_id: controlId, confidence: "manual_confirmed", rationale: rationale ?? null }),
  });
}

// ── POST /api/v1/evidence/{id}/review (set the HUMAN review verdict) ─────────
// review_status is the authoritative human verdict; "rejected" requires notes
// (backend 400s otherwise). Distinct from the AI assessment SUGGESTION.
export const EVIDENCE_REVIEW_STATUSES = ["verified", "rejected", "needs_review"] as const;
export type EvidenceReviewStatus = (typeof EVIDENCE_REVIEW_STATUSES)[number];

export function reviewEvidence(evidenceId: string, reviewStatus: EvidenceReviewStatus, reviewNotes?: string | null) {
  return apiFetch<Evidence>(`/api/v1/evidence/${evidenceId}/review`, {
    method: "POST",
    body: JSON.stringify({ review_status: reviewStatus, review_notes: reviewNotes?.trim() || null }),
  });
}

export function unlinkEvidenceControl(evidenceId: string, controlId: string) {
  return apiFetch<EvidenceControlLink>(`/api/v1/evidence/${evidenceId}/controls/${controlId}`, { method: "DELETE" });
}

// ── GET /api/v1/evidence/{id}/ai-assessment ─────────────────────────────────
// A SUGGESTION with reasoning, never a verdict. The assessment runs async via a
// drain job, so the endpoint 404s until it exists — we map that to `null` so the
// UI can show a graceful "not yet assessed" state rather than an error.
export type EvidenceAiAssessment = {
  evidence_id: string;
  ai_assessment_status: "suggested_valid" | "suggested_incomplete" | "suggested_mismatch" | "unable_to_assess";
  appears_to_be: string | null;
  appears_to_cover: string | null;
  missing_or_mismatched: string[];
  explanation: string;
  linked_control_id: string | null;
  content_source: string;
  provider_used: string | null;
  assessment_version: number;
  created_at: string;
};

export async function getEvidenceAiAssessment(evidenceId: string): Promise<EvidenceAiAssessment | null> {
  try {
    return await apiFetch<EvidenceAiAssessment>(`/api/v1/evidence/${evidenceId}/ai-assessment`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null; // not yet assessed
    throw err;
  }
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
// Live shape: paginated envelope { total, limit, offset, items: [...] };
// items carry control_name + reason.
export type EvidenceReadinessGap = {
  control_id?: string | null;
  control_name?: string | null;
  reason?: string | null;
  [key: string]: unknown;
};

type EvidenceReadinessGapsEnvelope = {
  total: number;
  limit: number;
  offset: number;
  items: EvidenceReadinessGap[];
};

export async function getEvidenceReadinessGaps(limit = 20) {
  const envelope = await apiFetch<EvidenceReadinessGapsEnvelope>(
    `/api/v1/evidence/readiness/gaps?limit=${limit}`,
  );
  return envelope.items ?? [];
}
