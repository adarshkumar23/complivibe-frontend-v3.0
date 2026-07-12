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

// ── GET /api/v1/non-human-identities (NonHumanIdentityRead[]) ───────────────
export type NonHumanIdentity = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  identity_type: string;
  owner_user_id: string;
  permissions_scope: string | null;
  external_ref: string | null;
  environment: string | null;
  last_used_at: string | null;
  rotation_due_at: string | null;
  last_rotated_at: string | null;
  status: string;
  is_active: boolean;
  is_orphaned: boolean;
  risk_level: string;
  risk_reason: string | null;
};

export function getNonHumanIdentities(params = "?limit=20") {
  return apiFetch<NonHumanIdentity[]>(`/api/v1/non-human-identities${params}`);
}

// ── POST /api/v1/non-human-identities (NonHumanIdentityCreate) ──────────────
/** Allowed identity_type values (pattern on NonHumanIdentityCreate.identity_type). */
export const NHI_TYPES = ["service_account", "api_key", "bot"] as const;
export type NhiType = (typeof NHI_TYPES)[number];

/** Allowed risk_level values (pattern on NonHumanIdentityCreate.risk_level). */
export const NHI_RISK_LEVELS = ["low", "medium", "high", "critical"] as const;
export type NhiRiskLevel = (typeof NHI_RISK_LEVELS)[number];

export type NhiCreatePayload = {
  name: string;
  identity_type: NhiType;
  owner_user_id: string;
  description?: string | null;
  environment?: string | null;
  permissions_scope?: string | null;
  external_ref?: string | null;
  risk_level?: NhiRiskLevel;
  risk_reason?: string | null;
};

export function createNonHumanIdentity(payload: NhiCreatePayload) {
  return apiFetch<NonHumanIdentity>("/api/v1/non-human-identities", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
