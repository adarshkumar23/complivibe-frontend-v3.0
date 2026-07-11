import { apiFetch } from "@/lib/api/client";

/**
 * Policy domain API — typed against the live backend schema
 * (/api/v1/compliance/policies* + /api/v1/compliance/policy-templates*).
 *
 * Lifecycle (verified against the live backend):
 *   policy.status is strictly linear: draft → under_review → approved → deprecated → archived
 *   (PATCH enforces one step at a time; /archive only from "deprecated").
 *   Versions: draft|rejected → submitted (via submit-for-approval) → approved|rejected.
 *   Approving an approval request (as the assigned approver, never the requester)
 *   sets version=approved+live, supersedes older approved versions, and moves the
 *   policy itself to "approved".
 */

// Allowed policy_type values (CompliancePolicyCreate regex in the live OpenAPI spec).
export const POLICY_TYPES = [
  "acceptable_use",
  "data_retention",
  "data_privacy",
  "incident_response",
  "access_control",
  "change_management",
  "business_continuity",
  "vendor_management",
  "information_security",
  "ai_governance",
  "third_party_risk",
  "other"
] as const;
export type PolicyType = (typeof POLICY_TYPES)[number];

// ── GET /api/v1/compliance/policies (CompliancePolicyRead[]) ────────────────
export type Policy = {
  id: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
  title: string;
  description: string | null;
  policy_type: string;
  status: string;
  owner_user_id: string | null;
  approved_by_user_id: string | null;
  approved_at: string | null;
  effective_date: string | null;
  review_due_date: string | null;
  version: string | null;
  content_url: string | null;
  tags_json: Record<string, unknown> | unknown[] | null;
  notes: string | null;
  archived_at: string | null;
  archived_by_user_id: string | null;
  archive_reason: string | null;
  violation_count: number | null;
};

// Zero-arg so it can be used directly as a react-query queryFn.
export function getPolicies() {
  return apiFetch<Policy[]>("/api/v1/compliance/policies");
}

// ── GET /api/v1/compliance/policies/{policy_id} ─────────────────────────────
export function getPolicy(policyId: string) {
  return apiFetch<Policy>(`/api/v1/compliance/policies/${policyId}`);
}

// ── POST /api/v1/compliance/policies (CompliancePolicyCreate) ───────────────
export type PolicyCreatePayload = {
  title: string;
  policy_type: PolicyType;
  owner_user_id: string;
  description?: string | null;
  status?: string;
  effective_date?: string | null;
  review_due_date?: string | null;
  version?: string;
  content_url?: string | null;
  notes?: string | null;
};

export function createPolicy(payload: PolicyCreatePayload) {
  return apiFetch<Policy>("/api/v1/compliance/policies", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// ── PATCH /api/v1/compliance/policies/{policy_id} (CompliancePolicyUpdate) ──
// status accepts only the next linear step (draft→under_review→approved→deprecated→archived).
export type PolicyUpdatePayload = Partial<PolicyCreatePayload>;

export function updatePolicy(policyId: string, payload: PolicyUpdatePayload) {
  return apiFetch<Policy>(`/api/v1/compliance/policies/${policyId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

// ── POST /api/v1/compliance/policies/{policy_id}/archive ────────────────────
export function archivePolicy(policyId: string, reason: string) {
  return apiFetch<Policy>(`/api/v1/compliance/policies/${policyId}/archive`, {
    method: "POST",
    body: JSON.stringify({ reason })
  });
}

// ── GET/POST /api/v1/compliance/policies/{policy_id}/versions ───────────────
export type PolicyVersion = {
  id: string;
  organization_id: string;
  policy_id: string;
  version_number: string;
  content_snapshot_json: Record<string, unknown> | unknown[];
  change_summary: string | null;
  status: string; // draft | submitted | approved | rejected | superseded
  submitted_by_user_id: string | null;
  submitted_at: string | null;
  reviewed_by_user_id: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  content_sha256: string;
  created_at: string;
  is_live: boolean;
  referenced_by_active_campaign: boolean;
  stale_active_campaign_reference: boolean;
};

export function getPolicyVersions(policyId: string) {
  return apiFetch<PolicyVersion[]>(`/api/v1/compliance/policies/${policyId}/versions`);
}

export type PolicyVersionCreatePayload = {
  version_number: string;
  content_snapshot_json: Record<string, unknown> | unknown[];
  change_summary?: string | null;
};

export function createPolicyVersion(policyId: string, payload: PolicyVersionCreatePayload) {
  return apiFetch<PolicyVersion>(`/api/v1/compliance/policies/${policyId}/versions`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// ── POST …/versions/{version_id}/submit-for-approval ────────────────────────
// Only draft or rejected versions can be submitted (backend enforced).
export function submitVersionForApproval(policyId: string, versionId: string, notes?: string | null) {
  return apiFetch<PolicyVersion>(
    `/api/v1/compliance/policies/${policyId}/versions/${versionId}/submit-for-approval`,
    { method: "POST", body: JSON.stringify({ notes: notes ?? null }) }
  );
}

// ── GET/POST /api/v1/compliance/policies/{policy_id}/approval-requests ──────
export type PolicyApprovalRequest = {
  id: string;
  organization_id: string;
  policy_id: string;
  version_id: string;
  requested_by_user_id: string;
  approver_user_id: string;
  status: string; // pending | approved | rejected | cancelled
  notes: string | null;
  decided_at: string | null;
  created_at: string;
};

export function getPolicyApprovalRequests(policyId: string) {
  return apiFetch<PolicyApprovalRequest[]>(`/api/v1/compliance/policies/${policyId}/approval-requests`);
}

// Backend rules: approver must be an ACTIVE org member and the requester can
// never approve their own request.
export function createPolicyApprovalRequest(
  policyId: string,
  payload: { version_id: string; approver_user_id: string; notes?: string | null }
) {
  return apiFetch<PolicyApprovalRequest>(`/api/v1/compliance/policies/${policyId}/approval-requests`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// ── POST …/approval-requests/{request_id}/approve|reject|cancel ─────────────
export function approvePolicyApprovalRequest(
  policyId: string,
  requestId: string,
  payload: { notes?: string | null; review_notes?: string | null }
) {
  return apiFetch<PolicyApprovalRequest>(
    `/api/v1/compliance/policies/${policyId}/approval-requests/${requestId}/approve`,
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export function rejectPolicyApprovalRequest(
  policyId: string,
  requestId: string,
  payload: { notes?: string | null; review_notes?: string | null }
) {
  return apiFetch<PolicyApprovalRequest>(
    `/api/v1/compliance/policies/${policyId}/approval-requests/${requestId}/reject`,
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export function cancelPolicyApprovalRequest(policyId: string, requestId: string, reason: string) {
  return apiFetch<PolicyApprovalRequest>(
    `/api/v1/compliance/policies/${policyId}/approval-requests/${requestId}/cancel`,
    { method: "POST", body: JSON.stringify({ reason }) }
  );
}

// ── GET /api/v1/compliance/policies/summary ─────────────────────────────────
export type PolicySummary = {
  total_policies: number;
  by_status: Record<string, number>;
  by_policy_type: Record<string, number>;
};

export function getPolicySummary() {
  return apiFetch<PolicySummary>("/api/v1/compliance/policies/summary");
}

// ── GET /api/v1/compliance/policy-templates ─────────────────────────────────
export type PolicyTemplate = {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  category: string | null;
  policy_type: string | null;
  is_system: boolean | null;
  framework_tags: string[] | null;
  version: string | null;
  content?: string;
  clone_count?: number;
  is_active?: boolean;
};

export function getPolicyTemplates(pageSize = 20) {
  return apiFetch<PolicyTemplate[]>(`/api/v1/compliance/policy-templates?page_size=${pageSize}`);
}

// ── POST /api/v1/compliance/policy-templates/{template_id}/apply ────────────
// Creates a draft policy + a draft version 1.0 seeded from the template content.
export type PolicyTemplateApplyResponse = {
  policy_id: string;
  title: string;
  status: string;
  policy_version_id: string;
};

export function applyPolicyTemplate(templateId: string, overrideTitle?: string | null) {
  return apiFetch<PolicyTemplateApplyResponse>(`/api/v1/compliance/policy-templates/${templateId}/apply`, {
    method: "POST",
    body: JSON.stringify({ override_title: overrideTitle ?? null })
  });
}

// ── GET /api/v1/auth/me — current user (for approval gating in the UI) ──────
export type CurrentUser = {
  id: string;
  email: string;
  full_name: string | null;
  status: string;
  is_active: boolean;
};

export function getCurrentUser() {
  return apiFetch<CurrentUser>("/api/v1/auth/me");
}
