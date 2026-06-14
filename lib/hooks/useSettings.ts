"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getSettings,
  getProfile,
  getOrganization,
  getTeam,
  getIntegrations,
  getApiKeys,
  getNotificationSettings,
  getSecuritySettings
} from "@/lib/api/settings";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn });
}

export function useSettings() {
  const settings = useEndpoint("settings", getSettings);
  const profile = useEndpoint("profile", getProfile);
  const organization = useEndpoint("organization", getOrganization);
  const team = useEndpoint("team", getTeam);
  const integrations = useEndpoint("integrations", getIntegrations);
  const apiKeys = useEndpoint("api-keys", getApiKeys);
  const notifications = useEndpoint("notification-settings", getNotificationSettings);
  const security = useEndpoint("security-settings", getSecuritySettings);

  return { settings, profile, organization, team, integrations, apiKeys, notifications, security };
}

export type SettingsData = ReturnType<typeof useSettings>;
