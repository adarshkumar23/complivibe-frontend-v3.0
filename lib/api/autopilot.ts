import { apiFetch } from "@/lib/api/client";

/**
 * Governance Autopilot pipeline API — typed against the live backend schema
 * (/api/v1/ai-governance/autopilot/*, /api/v1/ai-governance/actions/templates,
 *  /api/v1/organizations/me/governance-settings).
 *
 * Pipeline: policy (guardrail) → execution intent (planned from a candidate
 * action) → approval request → human approve/reject → execution (only for the
 * few real-execution-eligible low-risk actions, when the org has opted in).
 */

// Backend enums — mirrored from AUTOPILOT_* constants in
// app/services/ai_system_risk_assessment_service.py (validated server-side).
export const AUTOPILOT_POLICY_MODES = [
  "disabled",
  "observe_only",
  "suggest_only",
  "draft_only",
  "require_approval",
  "execute_safe_later"
] as const;
export type AutopilotPolicyMode = (typeof AUTOPILOT_POLICY_MODES)[number];

export const AUTOPILOT_PRIORITY_BANDS = ["low", "medium", "high", "urgent"] as const;
export type PriorityBand = (typeof AUTOPILOT_PRIORITY_BANDS)[number];

// ── GET/POST /api/v1/ai-governance/autopilot/policies ───────────────────────
export type AutopilotPolicy = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  is_default: boolean;
  mode: string;
  max_allowed_priority_band_for_auto: string;
  external_effects_allowed: boolean;
  task_creation_allowed: boolean;
  review_creation_allowed: boolean;
  source_record_mutation_allowed: boolean;
  allowed_action_types_json: string[];
  blocked_action_types_json: string[];
  approval_required_action_types_json: string[];
  approval_required_priority_bands_json: string[];
  created_at: string | null;
  updated_at: string | null;
  archived_at?: string | null;
  [key: string]: unknown;
};

export type AutopilotPolicyCreate = {
  name: string;
  description?: string | null;
  mode: AutopilotPolicyMode;
  is_default?: boolean;
  max_allowed_priority_band_for_auto?: PriorityBand;
  external_effects_allowed?: boolean;
  task_creation_allowed?: boolean;
  review_creation_allowed?: boolean;
  source_record_mutation_allowed?: boolean;
};

export function getAutopilotPolicies() {
  return apiFetch<AutopilotPolicy[]>("/api/v1/ai-governance/autopilot/policies");
}

export function createAutopilotPolicy(payload: AutopilotPolicyCreate) {
  return apiFetch<AutopilotPolicy>("/api/v1/ai-governance/autopilot/policies", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// POST /api/v1/ai-governance/autopilot/policies/{policy_id}/set-default
export function setDefaultAutopilotPolicy(policyId: string) {
  return apiFetch<AutopilotPolicy>(`/api/v1/ai-governance/autopilot/policies/${policyId}/set-default`, {
    method: "POST",
    body: JSON.stringify({})
  });
}

// POST /api/v1/ai-governance/autopilot/policies/{policy_id}/archive
export function archiveAutopilotPolicy(policyId: string, reason?: string) {
  return apiFetch<AutopilotPolicy>(`/api/v1/ai-governance/autopilot/policies/${policyId}/archive`, {
    method: "POST",
    body: JSON.stringify(reason ? { reason } : {})
  });
}

// ── GET /api/v1/ai-governance/actions/templates ─────────────────────────────
export type ActionTemplate = {
  action_key: string;
  title: string;
  description: string;
  action_type: string;
  source_reason_codes: string[];
  default_priority_band: string;
  recommended_owner_type: string;
  target_entity_type: string;
  human_approval_required: boolean;
  automation_allowed: boolean;
  caveat: string;
};

export function getActionTemplates() {
  return apiFetch<{ templates: ActionTemplate[] }>("/api/v1/ai-governance/actions/templates");
}

// ── GET/POST /api/v1/ai-governance/autopilot/execution-intents ──────────────
export type CandidateActionInput = {
  action_key: string;
  action_type: string;
  priority_band: PriorityBand;
  source_reason_codes: string[];
  title?: string;
  /** Explicit opt-in for real auto-execution of low-risk eligible actions. */
  automation_allowed?: boolean;
};

export type ExecutionIntent = {
  id: string;
  intent_id: string;
  source_type: string;
  source_id: string | null;
  policy_id: string | null;
  intent_status: "planned" | "approval_required" | "blocked" | "archived" | string;
  approval_required: boolean;
  blocked: boolean;
  blocked_reasons_json: string[];
  plan_payload_json: {
    candidate_action?: {
      action_key?: string;
      action_type?: string;
      priority_band?: string;
      risk_tier?: string;
      title?: string;
      [key: string]: unknown;
    };
    auto_execute?: { eligible: boolean; reasons: string[] };
    [key: string]: unknown;
  } | null;
  created_at: string | null;
  archived_at?: string | null;
  caveat?: string | null;
  [key: string]: unknown;
};

export function getExecutionIntents() {
  return apiFetch<ExecutionIntent[]>("/api/v1/ai-governance/autopilot/execution-intents");
}

export function createExecutionIntent(payload: {
  source_type: "candidate_action";
  candidate_action_json: CandidateActionInput;
  policy_id?: string | null;
}) {
  return apiFetch<ExecutionIntent>("/api/v1/ai-governance/autopilot/execution-intents", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// POST /api/v1/ai-governance/autopilot/execution-intents/{intent_id}/archive
export function archiveExecutionIntent(intentId: string, reason?: string) {
  return apiFetch<ExecutionIntent>(`/api/v1/ai-governance/autopilot/execution-intents/${intentId}/archive`, {
    method: "POST",
    body: JSON.stringify(reason ? { reason } : {})
  });
}

// POST /api/v1/ai-governance/autopilot/execution-intents/{intent_id}/approval-requests
export function requestExecutionApproval(intentId: string, approvalNote?: string) {
  return apiFetch<ExecutionApproval>(
    `/api/v1/ai-governance/autopilot/execution-intents/${intentId}/approval-requests`,
    { method: "POST", body: JSON.stringify({ approval_note: approvalNote ?? null }) }
  );
}

// ── GET /api/v1/ai-governance/autopilot/execution-approvals ─────────────────
export type ExecutionApproval = {
  id: string;
  approval_id: string;
  execution_intent_id: string;
  approval_status: "requested" | "approved" | "rejected" | "cancelled" | string;
  requested_by_user_id: string | null;
  requested_at: string | null;
  decided_by_user_id: string | null;
  decided_at: string | null;
  decision_reason: string | null;
  approval_note: string | null;
  created_at: string | null;
  [key: string]: unknown;
};

export function getExecutionApprovals() {
  return apiFetch<ExecutionApproval[]>("/api/v1/ai-governance/autopilot/execution-approvals");
}

// POST /api/v1/ai-governance/autopilot/execution-approvals/{approval_id}/approve
export function approveExecutionApproval(approvalId: string, decisionReason?: string) {
  return apiFetch<ExecutionApproval>(
    `/api/v1/ai-governance/autopilot/execution-approvals/${approvalId}/approve`,
    { method: "POST", body: JSON.stringify({ decision_reason: decisionReason ?? null }) }
  );
}

// POST /api/v1/ai-governance/autopilot/execution-approvals/{approval_id}/reject
// decision_reason is REQUIRED by the backend schema.
export function rejectExecutionApproval(approvalId: string, decisionReason: string) {
  return apiFetch<ExecutionApproval>(
    `/api/v1/ai-governance/autopilot/execution-approvals/${approvalId}/reject`,
    { method: "POST", body: JSON.stringify({ decision_reason: decisionReason }) }
  );
}

// ── GET /api/v1/ai-governance/autopilot/execution-intents/{intent_id}/readiness
export type IntentReadiness = {
  intent_id: string;
  intent_status: string;
  latest_approval_id: string | null;
  latest_approval_status: string | null;
  readiness_state: string;
  ready_for_runner: boolean;
  blocked_reasons: string[];
  approval_required: boolean;
  quorum_met: boolean;
  [key: string]: unknown;
};

export function getIntentReadiness(intentId: string) {
  return apiFetch<IntentReadiness>(`/api/v1/ai-governance/autopilot/execution-intents/${intentId}/readiness`);
}

// ── GET /api/v1/ai-governance/autopilot/executions ──────────────────────────
export type AutopilotExecution = {
  id: string;
  execution_id: string;
  execution_intent_id: string;
  action_key: string;
  action_type: string;
  risk_tier: string;
  execution_status: "executed" | "reversed" | string;
  before_snapshot_json: Record<string, unknown> | null;
  after_snapshot_json: Record<string, unknown> | null;
  reversal_deadline_at: string | null;
  reversed_at: string | null;
  reversal_reason: string | null;
  created_at: string | null;
  [key: string]: unknown;
};

export function getAutopilotExecutions() {
  return apiFetch<AutopilotExecution[]>("/api/v1/ai-governance/autopilot/executions");
}

// POST /api/v1/ai-governance/autopilot/executions/{execution_id}/reverse
export function reverseAutopilotExecution(executionId: string, reason?: string) {
  return apiFetch<AutopilotExecution>(`/api/v1/ai-governance/autopilot/executions/${executionId}/reverse`, {
    method: "POST",
    body: JSON.stringify(reason ? { reason } : {})
  });
}

// ── GET/PATCH /api/v1/organizations/me/governance-settings ──────────────────
export type GovernanceSettings = {
  autopilot_auto_execute_enabled: boolean;
  autopilot_auto_execute_confidence_threshold: number | null;
  autopilot_auto_execute_reversal_window_hours: number | null;
  batch_cancellation_requires_approval: boolean;
  updated_at: string | null;
  [key: string]: unknown;
};

export function getGovernanceSettings() {
  return apiFetch<GovernanceSettings>("/api/v1/organizations/me/governance-settings");
}

export function patchGovernanceSettings(payload: {
  autopilot_auto_execute_enabled?: boolean;
  autopilot_auto_execute_confidence_threshold?: number;
  autopilot_auto_execute_reversal_window_hours?: number;
}) {
  return apiFetch<GovernanceSettings>("/api/v1/organizations/me/governance-settings", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}
