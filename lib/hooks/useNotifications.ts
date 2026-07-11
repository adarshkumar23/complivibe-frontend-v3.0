"use client";

import { useQuery } from "@tanstack/react-query";
import { getInbox, getNotificationPreferences } from "@/lib/api/notifications";

export function useNotifications() {
  const inbox = useQuery({ queryKey: ["inbox"], queryFn: () => getInbox(25) });
  const preferences = useQuery({ queryKey: ["notification-preferences"], queryFn: getNotificationPreferences });

  return { inbox, preferences };
}

export type NotificationsData = ReturnType<typeof useNotifications>;
