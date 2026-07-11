import { apiFetch } from "@/lib/api/client";

/**
 * Security API — typed against the live backend schema
 * (/api/v1/security/*, /api/v1/non-human-identities, /api/v1/sod-conflicts).
 */

// ── GET /api/v1/security/scan-jobs/summary ──────────────────────────────────
export type ScanJobsSummary = {
  total_scans: number;
  by_source: Record<string, number>;
  total_critical: number;
  total_issues_created: number;
  last_scan_at: string | null;
};

export function getScanJobsSummary() {
  return apiFetch<ScanJobsSummary>("/api/v1/security/scan-jobs/summary");
}

// ── GET /api/v1/security/scan-jobs ──────────────────────────────────────────
export type ScanJob = {
  id: string;
  scan_source?: string | null;
  status?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

export function getScanJobs(params = "?limit=20") {
  return apiFetch<ScanJob[]>(`/api/v1/security/scan-jobs${params}`);
}

// ── GET /api/v1/non-human-identities/summary ────────────────────────────────
export type NhiSummary = {
  total_identities: number;
  active_identities: number;
  stale_identities: number;
  unrotated_identities: number;
  orphaned_identities: number;
  high_risk_identities: number;
  by_type: Record<string, number>;
  by_risk_level: Record<string, number>;
};

export function getNhiSummary() {
  return apiFetch<NhiSummary>("/api/v1/non-human-identities/summary");
}

// ── GET /api/v1/sod-conflicts/findings ──────────────────────────────────────
export type SodFinding = {
  id: string;
  finding_status?: string | null;
  user_id?: string | null;
  rule_id?: string | null;
  [key: string]: unknown;
};

export function getSodFindings() {
  return apiFetch<SodFinding[]>("/api/v1/sod-conflicts/findings");
}
