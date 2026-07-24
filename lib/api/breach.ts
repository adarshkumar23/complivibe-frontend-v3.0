import { apiFetch } from "@/lib/api/client";

/**
 * Breach-notification domain — /api/v1/compliance/breach-notifications*.
 * A breach is declared AGAINST an existing compliance issue; declaring one emits a
 * `data_breach` event, which fires any matching contractual breach-notification
 * commitments (patent P9). Writes are entitlement-gated on privacy_basic (statutory —
 * available on every plan incl. Free) and RBAC-gated on issues:admin.
 */

export const BREACH_TYPES = ["personal_data", "financial", "health", "confidential"] as const;
export type BreachType = (typeof BREACH_TYPES)[number];

export const BREACH_FRAMEWORKS = ["gdpr", "dora", "nis2", "hipaa", "ccpa", "dpdp"] as const;
export type BreachFramework = (typeof BREACH_FRAMEWORKS)[number];

// Lifecycle: assessing → notification_due → regulator_notified → subjects_notified → closed
export const BREACH_STATUSES = ["assessing", "notification_due", "regulator_notified", "subjects_notified", "closed"] as const;
export type BreachStatus = (typeof BREACH_STATUSES)[number];

export type BreachCreateInput = {
  breach_type: BreachType;
  personal_data_affected: boolean;
  estimated_affected_count?: number | null;
  regulatory_notification_required: boolean;
  regulatory_framework?: BreachFramework | null;
  regulatory_notification_hours?: number;
  supervisory_authority?: string | null;
  subject_notification_required: boolean;
};

export type BreachNotification = {
  id: string;
  organization_id: string;
  issue_id: string;
  breach_type: BreachType;
  personal_data_affected: boolean;
  estimated_affected_count: number | null;
  regulatory_notification_required: boolean;
  regulatory_framework: BreachFramework | null;
  regulatory_notification_hours: number;
  regulatory_notification_deadline: string | null;
  supervisory_authority: string | null;
  regulatory_notified_at: string | null;
  subject_notification_required: boolean;
  subjects_notified_at: string | null;
  status: BreachStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  age_hours: number;
  time_to_deadline_hours: number | null;
  overdue_by_hours: number;
  context_flags: string[];
};

export function getBreachNotifications() {
  return apiFetch<BreachNotification[]>("/api/v1/compliance/breach-notifications");
}

/** POST /api/v1/compliance/breach-notifications?issue_id=… — declare a breach.
 * This endpoint (not the issues-router twin) is the one write-gated on privacy_basic,
 * so a Free org can declare a breach on an existing issue. */
export function declareBreach(issueId: string, body: BreachCreateInput) {
  return apiFetch<BreachNotification>(`/api/v1/compliance/breach-notifications?issue_id=${encodeURIComponent(issueId)}`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function recordRegulatorNotification(breachId: string) {
  return apiFetch<BreachNotification>(`/api/v1/compliance/breach-notifications/${breachId}/record-regulator-notification`, { method: "POST" });
}

export function recordSubjectNotification(breachId: string) {
  return apiFetch<BreachNotification>(`/api/v1/compliance/breach-notifications/${breachId}/record-subject-notification`, { method: "POST" });
}

export function closeBreach(breachId: string) {
  return apiFetch<BreachNotification>(`/api/v1/compliance/breach-notifications/${breachId}/close`, { method: "POST" });
}
