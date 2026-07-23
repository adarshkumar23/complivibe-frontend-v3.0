import { apiFetch } from "@/lib/api/client";

/**
 * Policy Exceptions API — typed against the live backend schema
 * (/api/v1/compliance/policy-exceptions*).
 *
 * Four-eyes control (backend enforced):
 *   - approving/rejecting your OWN request → 409
 *     ("Approver cannot be requester" / "Rejector cannot be requester").
 *   - approving/rejecting a non-pending exception → 400.
 * The UI mirrors this: approve/reject actions are hidden from the requester and
 * only offered on pending exceptions to other reviewers with compliance_policies:write.
 */

// status enum, from the live backend.
export const EXCEPTION_STATUSES = ["pending", "approved", "rejected", "expired", "withdrawn"] as const;
export type ExceptionStatus = (typeof EXCEPTION_STATUSES)[number];

// ── GET /api/v1/compliance/policy-exceptions (PLAIN ARRAY, NOT wrapped) ──────
export type PolicyException = {
  id: string;
  organization_id: string;
  policy_id: string;
  reason: string | null;
  requested_by: string;
  approved_by: string | null;
  rejected_by: string | null;
  status: string;
  compensating_measure_description: string | null;
  expiry_date: string | null; // "YYYY-MM-DD"
  approved_at: string | null;
  rejected_at: string | null;
  expired_at: string | null;
  created_at: string;
  updated_at: string;
  policy_is_archived: boolean;
  policy_current_version: string | null;
};

export type PolicyExceptionListParams = {
  policy_id?: string;
  status_value?: string;
  page?: number;
  page_size?: number;
};

export function getPolicyExceptions(params: PolicyExceptionListParams = {}) {
  const qs = new URLSearchParams();
  if (params.policy_id) qs.set("policy_id", params.policy_id);
  if (params.status_value) qs.set("status_value", params.status_value);
  qs.set("page", String(params.page ?? 1));
  qs.set("page_size", String(params.page_size ?? 20));
  return apiFetch<PolicyException[]>(`/api/v1/compliance/policy-exceptions?${qs.toString()}`);
}

// ── GET /api/v1/compliance/policy-exceptions/{id} ───────────────────────────
export function getPolicyException(exceptionId: string) {
  return apiFetch<PolicyException>(`/api/v1/compliance/policy-exceptions/${exceptionId}`);
}

// ── POST /api/v1/compliance/policy-exceptions (request an exception) ─────────
// Perm compliance_policies:write.
export type PolicyExceptionCreatePayload = {
  policy_id: string;
  reason: string; // min length 1
  compensating_measure_description?: string | null;
};

export function createPolicyException(payload: PolicyExceptionCreatePayload) {
  return apiFetch<PolicyException>("/api/v1/compliance/policy-exceptions", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// ── POST /api/v1/compliance/policy-exceptions/{id}/approve ───────────────────
// Perm compliance_policies:write. Requester cannot approve (409). Non-pending → 400.
export function approvePolicyException(exceptionId: string, expiryDate: string) {
  return apiFetch<PolicyException>(`/api/v1/compliance/policy-exceptions/${exceptionId}/approve`, {
    method: "POST",
    body: JSON.stringify({ expiry_date: expiryDate })
  });
}

// ── POST /api/v1/compliance/policy-exceptions/{id}/reject (NO body) ──────────
// Perm compliance_policies:write. Requester cannot reject (409). Non-pending → 400.
export function rejectPolicyException(exceptionId: string) {
  return apiFetch<PolicyException>(`/api/v1/compliance/policy-exceptions/${exceptionId}/reject`, {
    method: "POST"
  });
}
