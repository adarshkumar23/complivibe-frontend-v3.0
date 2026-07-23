import { apiFetch } from "@/lib/api/client";

/**
 * Signed-export domain API — typed against the live backend schema (/api/v1/exports*).
 *
 * Exports are integrity-bound: once run, a job carries a checksum + signature and a
 * validity window (valid_from → not_after). The UI must never let an expired or
 * revoked export look valid, so the verify result models each failure reason distinctly.
 */

// ── Enums ────────────────────────────────────────────────────────────────────
export const EXPORT_STATUSES = [
  "queued",
  "processing",
  "completed",
  "failed",
  "cancelled",
  "archived"
] as const;
export type ExportStatus = (typeof EXPORT_STATUSES)[number];

export const ATTESTATION_STATUSES = ["unattested", "attested", "revoked"] as const;
export type AttestationStatus = (typeof ATTESTATION_STATUSES)[number];

/**
 * export_type values accepted by the backend. We surface the JSON package types.
 * compliance_report_json needs source_report_id and framework_readiness_json needs
 * framework_id, so those are excluded from the create dropdown (SIMPLE_EXPORT_TYPES)
 * to keep creation dependency-free.
 */
export const EXPORT_TYPES = [
  "compliance_report_json",
  "framework_readiness_json",
  "evidence_manifest_json",
  "risk_register_json",
  "task_execution_json",
  "executive_summary_json",
  "audit_preparation_json"
] as const;
export type ExportType = (typeof EXPORT_TYPES)[number];

/** Types that need no extra source id — safe defaults for the create dropdown. */
export const SIMPLE_EXPORT_TYPES = [
  "executive_summary_json",
  "risk_register_json",
  "evidence_manifest_json",
  "task_execution_json",
  "audit_preparation_json"
] as const;

/** The exact verify reason values the backend returns. */
export const VERIFY_REASONS = [
  "valid",
  "expired",
  "revoked",
  "invalid_signature",
  "checksum_mismatch"
] as const;
export type VerifyReason = (typeof VERIFY_REASONS)[number];

// ── ExportJobRead ─────────────────────────────────────────────────────────────
export type ExportJobRead = {
  id: string;
  organization_id: string;
  export_type: string;
  title: string | null;
  description: string | null;
  status: ExportStatus;
  requested_by_user_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  cancelled_at: string | null;
  archived_at: string | null;
  error_message: string | null;
  checksum_sha256: string | null;
  integrity_signature: string | null;
  signing_key_id: string | null;
  signature_algorithm: string | null;
  valid_from: string | null;
  not_after: string | null;
  legal_hold: boolean;
  attestation_status: AttestationStatus;
  package_version: string | null;
  age_days: number | null;
  is_terminal: boolean;
  is_integrity_bound: boolean;
  context_flags: string[];
  created_at: string;
  updated_at: string;
};

export type ExportJobEventRead = {
  id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  created_at: string;
  [key: string]: unknown;
};

export type ExportPackageResponse = {
  export_job_id: string;
  checksum_sha256: string;
  signature_algorithm: string;
  signing_key_id: string;
  integrity_signature: string;
  valid_from: string | null;
  not_after: string | null;
  package_json: unknown;
};

export type ExportVerifyResponse = {
  export_job_id: string;
  valid: boolean;
  checksum_match: boolean;
  signature_match: boolean | null;
  expired: boolean;
  revoked: boolean;
  reason: VerifyReason | string | null;
  not_after: string | null;
  checked_at: string;
};

// ── GET /api/v1/exports/jobs (LIST — WRAPPED in {jobs}) ────────────────────────
export function getExportJobs(limit = 50) {
  return apiFetch<{ jobs: ExportJobRead[] }>(`/api/v1/exports/jobs?limit=${limit}`);
}

// ── GET /api/v1/exports/jobs/{id} (detail + events) ───────────────────────────
export function getExportJob(id: string) {
  return apiFetch<{ job: ExportJobRead; events: ExportJobEventRead[] }>(`/api/v1/exports/jobs/${id}`);
}

// ── POST /api/v1/exports/jobs (create) ────────────────────────────────────────
export type ExportCreatePayload = {
  export_type: string;
  title?: string | null;
  description?: string | null;
  validity_days?: number;
};

export function createExportJob(payload: ExportCreatePayload) {
  return apiFetch<ExportJobRead>("/api/v1/exports/jobs", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// ── POST /api/v1/exports/jobs/{id}/run (build + sign) ─────────────────────────
export function runExportJob(id: string) {
  return apiFetch<{ job: ExportJobRead }>(`/api/v1/exports/jobs/${id}/run`, { method: "POST" });
}

// ── POST /api/v1/exports/jobs/{id}/cancel ─────────────────────────────────────
export function cancelExportJob(id: string, reason?: string) {
  return apiFetch<{ job: ExportJobRead }>(`/api/v1/exports/jobs/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify(reason ? { reason } : {})
  });
}

// ── GET /api/v1/exports/jobs/{id}/package (download; 400 if not completed) ─────
export function getExportPackage(id: string) {
  return apiFetch<ExportPackageResponse>(`/api/v1/exports/jobs/${id}/package`);
}

// ── POST /api/v1/exports/jobs/{id}/verify ─────────────────────────────────────
export function verifyExportJob(id: string) {
  return apiFetch<ExportVerifyResponse>(`/api/v1/exports/jobs/${id}/verify`, { method: "POST" });
}

/**
 * Fetch a completed job's signed package and hand the package_json to the browser
 * as a downloaded .json file (Blob). No-op safe on the server.
 */
export async function downloadExportPackage(id: string, filenameBase = "export"): Promise<void> {
  const pkg = await getExportPackage(id);
  if (typeof window === "undefined") return;
  const json = JSON.stringify(pkg.package_json ?? pkg, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenameBase.replace(/[^a-z0-9._-]+/gi, "_")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** True when the job's validity window has already elapsed (not_after in the past). */
export function isExpired(notAfter: string | null | undefined): boolean {
  if (!notAfter) return false;
  const t = new Date(notAfter).getTime();
  if (Number.isNaN(t)) return false;
  return t < Date.now();
}
