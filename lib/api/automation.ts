import { apiFetch } from "@/lib/api/client";

/**
 * Automation + Governance Autopilot API — typed against the live backend schema
 * (/api/v1/automation/*, /api/v1/ai-governance/autopilot/*, /api/v1/governance/overrides*).
 */

// ── GET /api/v1/automation/summary ──────────────────────────────────────────
export type AutomationSummary = {
  active_rules: number;
  inactive_rules: number;
  archived_rules: number;
  executions_last_24h: number;
  actions_created_last_24h: number;
  duplicate_actions_skipped_last_24h: number;
  failed_actions_last_24h: number;
  execution_error_rate_last_24h: number;
  stale_active_rules: number;
  active_scheduled_rules_overdue: number;
  context_flags: string[] | null;
};

export function getAutomationSummary() {
  return apiFetch<AutomationSummary>("/api/v1/automation/summary");
}

// ── GET /api/v1/automation/rules ────────────────────────────────────────────
export type AutomationRule = {
  id: string;
  name?: string | null;
  title?: string | null;
  status?: string | null;
  trigger_type?: string | null;
  action_type?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

export function getAutomationRules() {
  return apiFetch<AutomationRule[]>("/api/v1/automation/rules");
}

// ── POST/PATCH /api/v1/automation/rules — enums mirror the backend
// (app/services/automation_service.py ALLOWED_* + schemas/automation.py) ─────
export const AUTOMATION_TRIGGERS = ["manual_scan", "scheduled_placeholder", "entity_state_change_placeholder"] as const;
export const AUTOMATION_CONDITIONS = [
  "risk_critical_without_control",
  "risk_without_owner",
  "risk_review_overdue",
  "control_without_evidence",
  "control_needs_review",
  "evidence_expired",
  "evidence_needs_review",
  "obligation_applicable_without_control",
  "task_overdue"
] as const;
export const AUTOMATION_ACTIONS = ["create_task", "queue_email_reminder", "create_task_and_queue_email"] as const;
export const AUTOMATION_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export const AUTOMATION_STATUSES = ["active", "inactive"] as const;

export type AutomationRuleInput = {
  name: string;
  description?: string | null;
  trigger_type: (typeof AUTOMATION_TRIGGERS)[number];
  condition_type: (typeof AUTOMATION_CONDITIONS)[number];
  action_type: (typeof AUTOMATION_ACTIONS)[number];
  priority: (typeof AUTOMATION_PRIORITIES)[number];
  status: (typeof AUTOMATION_STATUSES)[number];
};

export function createAutomationRule(body: AutomationRuleInput) {
  return apiFetch<AutomationRule>("/api/v1/automation/rules", { method: "POST", body: JSON.stringify(body) });
}
export function updateAutomationRule(ruleId: string, body: Partial<AutomationRuleInput>) {
  return apiFetch<AutomationRule>(`/api/v1/automation/rules/${ruleId}`, { method: "PATCH", body: JSON.stringify(body) });
}

// ── GET /api/v1/automation/executions ───────────────────────────────────────
export type AutomationExecution = {
  id: string;
  rule_id?: string | null;
  status?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  [key: string]: unknown;
};

export function getAutomationExecutions(limit = 20) {
  return apiFetch<AutomationExecution[]>(`/api/v1/automation/executions?limit=${limit}`);
}

// ── GET /api/v1/ai-governance/autopilot/summary ─────────────────────────────
export type AutopilotSummary = {
  total_policies: number;
  active_policies: number;
  archived_policies: number;
  default_policy_id: string | null;
  resolved_mode: string;
  resolved_source: string;
  external_effects_allowed: boolean;
  task_creation_allowed: boolean;
  review_creation_allowed: boolean;
  source_record_mutation_allowed: boolean;
  pending_execution_intents: number;
  pending_approval_requests: number;
  open_critical_signals: number;
};

export function getAutopilotSummary() {
  return apiFetch<AutopilotSummary>("/api/v1/ai-governance/autopilot/summary");
}

// ── GET /api/v1/ai-governance/autopilot/execution-intents/summary ───────────
export type ExecutionIntentsSummary = {
  total_intents: number;
  by_status: Record<string, number>;
  by_source_type: Record<string, number>;
  blocked_count: number;
  approval_required_count: number;
  pending_intents: number;
  stale_pending_intents: number;
  latest_intent_at: string | null;
  context_flags: string[] | null;
  caveat: string | null;
};

export function getExecutionIntentsSummary() {
  return apiFetch<ExecutionIntentsSummary>("/api/v1/ai-governance/autopilot/execution-intents/summary");
}

// ── GET /api/v1/ai-governance/autopilot/execution-approvals/summary ─────────
export type ExecutionApprovalsSummary = {
  total_approvals: number;
  by_status: Record<string, number>;
  ready_for_runner_count: number;
  approval_required_count: number;
  blocked_count: number;
  latest_approval_at: string | null;
  caveat: string | null;
};

export function getExecutionApprovalsSummary() {
  return apiFetch<ExecutionApprovalsSummary>("/api/v1/ai-governance/autopilot/execution-approvals/summary");
}

// ── GET /api/v1/ai-governance/actions/candidate-summary ─────────────────────
export type CandidateActionsSummary = {
  total_candidate_actions: number;
  by_action_type: Record<string, number>;
  by_priority_band: Record<string, number>;
  top_action_keys: unknown[];
  top_ai_systems_by_action_count: unknown[];
  caveat: string | null;
};

export function getCandidateActionsSummary() {
  return apiFetch<CandidateActionsSummary>("/api/v1/ai-governance/actions/candidate-summary");
}

// ── GET /api/v1/governance/overrides/summary ────────────────────────────────
export type OverridesSummary = {
  total_requests: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests: number;
  executed_requests: number;
  cancelled_requests: number;
  expired_requests: number;
  pending_approval_over_24h: number;
  overrides_executed_last_30d: number;
  pending_expiring_within_24h: number;
  approved_awaiting_execution: number;
  execution_failed_last_30d: number;
  context_flags: string[] | null;
};

export function getOverridesSummary() {
  return apiFetch<OverridesSummary>("/api/v1/governance/overrides/summary");
}
