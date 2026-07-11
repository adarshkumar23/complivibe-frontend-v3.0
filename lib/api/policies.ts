import { apiFetch } from "@/lib/api/client";

/**
 * Policy domain API — typed against the live backend schema
 * (/api/v1/compliance/policies* + /api/v1/compliance/policy-templates*).
 */

// ── GET /api/v1/compliance/policies ─────────────────────────────────────────
export type Policy = {
  id: string;
  created_at: string;
  updated_at: string;
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
  notes: string | null;
};

export function getPolicies() {
  return apiFetch<Policy[]>("/api/v1/compliance/policies");
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
};

export function getPolicyTemplates(pageSize = 20) {
  return apiFetch<PolicyTemplate[]>(`/api/v1/compliance/policy-templates?page_size=${pageSize}`);
}
