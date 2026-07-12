import { apiFetch } from "@/lib/api/client";

/**
 * Proactive Insights API — the compliance inbox and AI governance recommendation
 * engine, typed against the live backend schema:
 *   GET  /api/v1/inbox
 *   GET  /api/v1/ai-governance/systems/{system_id}/recommendations
 *   POST /api/v1/ai-governance/systems/{system_id}/generate-recommendations
 *   POST /api/v1/ai-governance/recommendations/{rec_id}/apply
 *   POST /api/v1/ai-governance/recommendations/{rec_id}/dismiss
 *
 * There is no single org-wide recommendations endpoint on the backend — recommendations
 * are scoped per AI system, so the frontend fans out across every registered AI system.
 */

// ── GET /api/v1/inbox ────────────────────────────────────────────────────────
export type ComplianceInboxItem = {
  item_key: string;
  item_type: string;
  title: string;
  detail: string | null;
  reason: string | null;
  priority_score: number;
  due_at: string | null;
  navigate_path: string | null;
  metadata: Record<string, unknown>;
};

export type ComplianceInboxResponse = {
  total_items: number;
  items: ComplianceInboxItem[];
};

export function getComplianceInbox(limit = 100) {
  return apiFetch<ComplianceInboxResponse>(`/api/v1/inbox?limit=${limit}`);
}

// ── AI governance recommendations ────────────────────────────────────────────
export type AiRiskRecommendation = {
  id: string;
  organization_id: string;
  ai_system_id: string;
  source_type: string;
  recommendation_text: string;
  recommendation_category: string;
  priority: string;
  status: string;
  source_ref_id: string | null;
  created_at: string;
  updated_at: string;
  priority_weight: number;
  action_due_in_days: number;
  linked_task_count: number;
  source_age_days: number | null;
  stale_source: boolean;
  source_updated_after_generation: boolean;
  context_flags: string[];
};

export function listSystemRecommendations(systemId: string, params?: { status?: string; priority?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.priority) qs.set("priority", params.priority);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<AiRiskRecommendation[]>(
    `/api/v1/ai-governance/systems/${encodeURIComponent(systemId)}/recommendations${suffix}`
  );
}

export function generateSystemRecommendations(systemId: string) {
  return apiFetch<AiRiskRecommendation[]>(
    `/api/v1/ai-governance/systems/${encodeURIComponent(systemId)}/generate-recommendations`,
    { method: "POST" }
  );
}

export function applyRecommendation(recId: string) {
  return apiFetch<AiRiskRecommendation>(`/api/v1/ai-governance/recommendations/${encodeURIComponent(recId)}/apply`, {
    method: "POST"
  });
}

export function dismissRecommendation(recId: string) {
  return apiFetch<AiRiskRecommendation>(`/api/v1/ai-governance/recommendations/${encodeURIComponent(recId)}/dismiss`, {
    method: "POST"
  });
}
