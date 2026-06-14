"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getApiKeys, getSecuritySettings, getTeam, getOrganization,
  getSecuritySummary, getAuditLogs, getHealth, getProductionReadiness, getSecurityScan
} from "@/lib/api/security";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn, retry: false });
}

export function useSecurity() {
  const apiKeys = useEndpoint("api-keys", getApiKeys);
  const securitySettings = useEndpoint("security-settings", getSecuritySettings);
  const team = useEndpoint("team", getTeam);
  const organization = useEndpoint("organization", getOrganization);

  const summary = useEndpoint("security-summary", getSecuritySummary);
  const auditLogs = useEndpoint("audit-logs", getAuditLogs);
  const health = useEndpoint("system-health", getHealth);
  const readiness = useEndpoint("production-readiness", getProductionReadiness);
  const scan = useEndpoint("security-scan", getSecurityScan);

  return { apiKeys, securitySettings, team, organization, summary, auditLogs, health, readiness, scan };
}

export type SecurityData = ReturnType<typeof useSecurity>;
