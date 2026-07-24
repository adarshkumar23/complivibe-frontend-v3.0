import { apiFetch } from "@/lib/api/client";

/**
 * Notifications API — typed against the live backend schema
 * (/api/v1/inbox, /api/v1/preferences/notifications).
 */

// ── GET /api/v1/inbox ───────────────────────────────────────────────────────
export type InboxItem = {
  item_key: string;
  item_type: string;
  title: string;
  detail: string | null;
  /** Backend explanation of why this item is prioritized (e.g. "3 days overdue"). */
  reason: string | null;
  priority_score: number;
  due_at: string | null;
  navigate_path: string | null;
  metadata: Record<string, unknown> | null;
};

export function getInbox(limit = 25) {
  return apiFetch<{ total_items: number; items: InboxItem[] }>(`/api/v1/inbox?limit=${limit}`);
}

// ── GET /api/v1/preferences/notifications ───────────────────────────────────
export type NotificationPreference = {
  id: string;
  notification_type: string;
  channel: string;
  min_severity: string | null;
  is_enabled: boolean;
};

export function getNotificationPreferences() {
  return apiFetch<NotificationPreference[]>("/api/v1/preferences/notifications");
}

// ── PUT /api/v1/preferences/notifications/{notification_type} ────────────────
export function updateNotificationPreference(
  notificationType: string,
  body: { channel: string; is_enabled: boolean; min_severity?: string | null }
) {
  return apiFetch<NotificationPreference>(`/api/v1/preferences/notifications/${encodeURIComponent(notificationType)}`, {
    method: "PUT",
    body: JSON.stringify(body)
  });
}
