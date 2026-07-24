"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getInbox, getNotificationPreferences, updateNotificationPreference } from "@/lib/api/notifications";

export function useNotifications() {
  const inbox = useQuery({ queryKey: ["inbox"], queryFn: () => getInbox(25) });
  const preferences = useQuery({ queryKey: ["notification-preferences"], queryFn: getNotificationPreferences });

  return { inbox, preferences };
}

export type NotificationsData = ReturnType<typeof useNotifications>;

/** PUT /preferences/notifications/{type} — toggle a preference on/off. */
export function useUpdateNotificationPreference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ notificationType, channel, isEnabled, minSeverity }: { notificationType: string; channel: string; isEnabled: boolean; minSeverity?: string | null }) =>
      updateNotificationPreference(notificationType, { channel, is_enabled: isEnabled, min_severity: minSeverity ?? null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notification-preferences"] })
  });
}
