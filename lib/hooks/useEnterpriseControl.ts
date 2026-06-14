"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getOrganization, getTeam, getApiKeys, getSecuritySettings, getIntegrations, getSettings,
  getEnterpriseSummary, getProductionReadiness, getHealth, getAuditLogs
} from "@/lib/api/enterprise";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn, retry: false });
}

export function useEnterpriseControl() {
  const organization = useEndpoint("ent-organization", getOrganization);
  const team = useEndpoint("ent-team", getTeam);
  const apiKeys = useEndpoint("ent-api-keys", getApiKeys);
  const securitySettings = useEndpoint("ent-security-settings", getSecuritySettings);
  const integrations = useEndpoint("ent-integrations", getIntegrations);
  const settings = useEndpoint("ent-settings", getSettings);

  const summary = useEndpoint("ent-summary", getEnterpriseSummary);
  const readiness = useEndpoint("ent-readiness", getProductionReadiness);
  const health = useEndpoint("ent-health", getHealth);
  const auditLogs = useEndpoint("ent-audit", getAuditLogs);

  return { organization, team, apiKeys, securitySettings, integrations, settings, summary, readiness, health, auditLogs };
}

export type EnterpriseData = ReturnType<typeof useEnterpriseControl>;
