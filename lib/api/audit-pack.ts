import { apiFetch } from "@/lib/api/client";

/**
 * Audit domain API — typed against the live backend schema
 * (/api/v1/compliance/audit-engagements*, /audit-findings*, /pbc-items*, /api/v1/exports).
 */

// ── GET /api/v1/compliance/audit-engagements + /dashboard ───────────────────
export type AuditEngagement = {
  id: string;
  title?: string | null;
  audit_type?: string | null;
  status?: string | null;
  framework_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

export function getAuditEngagements(params = "") {
  return apiFetch<AuditEngagement[]>(`/api/v1/compliance/audit-engagements${params}`);
}

// ── POST /api/v1/compliance/audit-engagements (AuditEngagementCreate) ───────
export const ENGAGEMENT_AUDIT_TYPES = [
  "internal_readiness",
  "external_certification",
  "surveillance",
  "gap_assessment"
] as const;

export type AuditEngagementCreateInput = {
  title: string;
  audit_type: (typeof ENGAGEMENT_AUDIT_TYPES)[number];
  start_date: string;
  end_date: string;
  scope_framework_ids?: string[];
  lead_auditor_name?: string | null;
  audit_firm?: string | null;
  notes?: string | null;
};

export function createAuditEngagement(body: AuditEngagementCreateInput) {
  return apiFetch<AuditEngagement>("/api/v1/compliance/audit-engagements", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

// ── POST /api/v1/compliance/audit-engagements/{id}/transition ───────────────
// Mirrors AuditEngagementService.ALLOWED_TRANSITIONS (backend state machine).
export const ENGAGEMENT_NEXT_STATUSES: Record<string, string[]> = {
  planning: ["fieldwork", "cancelled"],
  fieldwork: ["review", "cancelled"],
  review: ["report_issuance", "fieldwork"],
  report_issuance: ["closed"],
  closed: [],
  cancelled: []
};

export function transitionAuditEngagement(engagementId: string, newStatus: string) {
  return apiFetch<AuditEngagement>(`/api/v1/compliance/audit-engagements/${engagementId}/transition`, {
    method: "POST",
    body: JSON.stringify({ new_status: newStatus })
  });
}

// ── GET /api/v1/compliance/audit-findings/engagement/{id} (AuditFindingRead) ─
export const FINDING_SEVERITIES = ["critical", "high", "medium", "low", "informational"] as const;

export type AuditFinding = {
  id: string;
  created_at: string;
  updated_at: string;
  audit_engagement_id: string;
  finding_ref?: string | null;
  severity: string;
  framework_ref?: string | null;
  title: string;
  description: string;
  assigned_owner_id: string;
  remediation_action: string;
  target_remediation_date: string;
  status: string;
  risk_register_entry_id?: string | null;
  control_id?: string | null;
  control_name?: string | null;
  closed_at?: string | null;
};

export function getAuditFindingsForEngagement(engagementId: string) {
  return apiFetch<AuditFinding[]>(`/api/v1/compliance/audit-findings/engagement/${engagementId}`);
}

// ── POST /api/v1/compliance/audit-findings?engagement_id= (AuditFindingCreate)
export type AuditFindingCreateInput = {
  severity: (typeof FINDING_SEVERITIES)[number];
  title: string;
  description: string;
  assigned_owner_id: string;
  remediation_action: string;
  target_remediation_date: string;
  framework_ref?: string | null;
};

export function createAuditFinding(engagementId: string, body: AuditFindingCreateInput) {
  return apiFetch<AuditFinding>(`/api/v1/compliance/audit-findings?engagement_id=${encodeURIComponent(engagementId)}`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

// ── POST /api/v1/compliance/audit-findings/{id}/transition ──────────────────
// Mirrors AuditFindingService.ALLOWED_TRANSITIONS (backend state machine) so the
// UI only offers moves the backend will accept.
export const FINDING_NEXT_STATUSES: Record<string, string[]> = {
  open: ["in_remediation", "accepted_risk", "closed"],
  in_remediation: ["remediated", "open"],
  remediation_in_progress: ["remediated", "resolved", "open"],
  remediated: ["closed", "open"],
  resolved: ["closed", "in_remediation"],
  accepted_risk: [],
  risk_accepted: [],
  closed: []
};

export function transitionAuditFinding(findingId: string, newStatus: string) {
  return apiFetch<AuditFinding>(`/api/v1/compliance/audit-findings/${findingId}/transition`, {
    method: "POST",
    body: JSON.stringify({ new_status: newStatus })
  });
}

// ── /api/v1/compliance/pbc-items* (PbcItemCreate/Read + submit/accept/reject) ─
export type PbcItem = {
  id: string;
  created_at: string;
  updated_at: string;
  audit_engagement_id: string;
  title: string;
  description?: string | null;
  requester_id: string;
  assignee_id?: string | null;
  due_date: string;
  status: string; // pending | submitted | accepted | rejected | overdue
  evidence_id?: string | null;
  submitted_at?: string | null;
  accepted_at?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  days_overdue?: number;
  acceptance_override_reason?: string | null;
};

export function getPbcItemsForEngagement(engagementId: string) {
  return apiFetch<PbcItem[]>(`/api/v1/compliance/pbc-items/engagement/${engagementId}`);
}

export type PbcItemCreateInput = {
  title: string;
  due_date: string;
  description?: string | null;
  assignee_id?: string | null;
};

export function createPbcItem(engagementId: string, body: PbcItemCreateInput) {
  return apiFetch<PbcItem>(`/api/v1/compliance/pbc-items?engagement_id=${encodeURIComponent(engagementId)}`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

/** Submit: pending → submitted; evidence_id optional (backend flags evidence-less items). */
export function submitPbcItem(itemId: string, evidenceId?: string | null) {
  return apiFetch<PbcItem>(`/api/v1/compliance/pbc-items/${itemId}/submit`, {
    method: "POST",
    body: JSON.stringify(evidenceId ? { evidence_id: evidenceId } : {})
  });
}

/** Accept: submitted → accepted; backend 422s without evidence unless override_reason is given. */
export function acceptPbcItem(itemId: string, overrideReason?: string | null) {
  return apiFetch<PbcItem>(`/api/v1/compliance/pbc-items/${itemId}/accept`, {
    method: "POST",
    body: JSON.stringify(overrideReason ? { override_reason: overrideReason } : {})
  });
}

/** Reject: submitted → rejected; reason is mandatory. */
export function rejectPbcItem(itemId: string, rejectionReason: string) {
  return apiFetch<PbcItem>(`/api/v1/compliance/pbc-items/${itemId}/reject`, {
    method: "POST",
    body: JSON.stringify({ rejection_reason: rejectionReason })
  });
}

export type AuditEngagementsDashboard = {
  total_engagements: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  upcoming: number;
  overdue: number;
};

export function getAuditEngagementsDashboard() {
  return apiFetch<AuditEngagementsDashboard>("/api/v1/compliance/audit-engagements/dashboard");
}

// ── GET /api/v1/compliance/audit-findings/summary ───────────────────────────
export type AuditFindingsSummary = {
  total: number;
  by_severity: Record<string, number>;
  by_status: Record<string, number>;
  open_critical_count: number;
  overdue_count: number;
  linked_to_risk_count: number;
};

export function getAuditFindingsSummary() {
  return apiFetch<AuditFindingsSummary>("/api/v1/compliance/audit-findings/summary");
}

// ── GET /api/v1/compliance/pbc-items/summary ────────────────────────────────
export type PbcItemsSummary = {
  total_items: number;
  by_status: Record<string, number>;
  overdue_count: number;
  completion_rate: number;
  items_without_evidence: number;
  avg_days_to_submit: number | null;
};

export function getPbcItemsSummary() {
  return apiFetch<PbcItemsSummary>("/api/v1/compliance/pbc-items/summary");
}

// ── GET /api/v1/exports/summary ─────────────────────────────────────────────
export type ExportsSummary = {
  [key: string]: unknown;
};

export function getExportsSummary() {
  return apiFetch<ExportsSummary>("/api/v1/exports/summary");
}
