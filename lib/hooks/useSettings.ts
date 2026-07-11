"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getMyOrganizations,
  getMemberships,
  getCustomRoles,
  getSessions,
  getSsoConfig,
  getOidcConfig,
  getIpAllowlist,
  getAiConfiguration
} from "@/lib/api/settings";

export function useSettings() {
  const orgs = useQuery({ queryKey: ["my-orgs"], queryFn: getMyOrganizations });
  const memberships = useQuery({ queryKey: ["memberships"], queryFn: getMemberships });
  const roles = useQuery({ queryKey: ["custom-roles"], queryFn: getCustomRoles });
  const sessions = useQuery({ queryKey: ["sessions"], queryFn: getSessions });
  const sso = useQuery({ queryKey: ["sso-config"], queryFn: getSsoConfig });
  const oidc = useQuery({ queryKey: ["oidc-config"], queryFn: getOidcConfig });
  const ipAllowlist = useQuery({ queryKey: ["ip-allowlist"], queryFn: getIpAllowlist });
  const aiConfig = useQuery({ queryKey: ["ai-config"], queryFn: getAiConfiguration });

  return { orgs, memberships, roles, sessions, sso, oidc, ipAllowlist, aiConfig };
}

export type SettingsData = ReturnType<typeof useSettings>;
