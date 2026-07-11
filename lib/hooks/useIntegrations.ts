"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getConnectorCatalog,
  getEnabledConnectors,
  getIssueSyncConnections,
  getSiemConfig,
  getEmailConfig
} from "@/lib/api/integrations";

export function useIntegrations() {
  const catalog = useQuery({ queryKey: ["connector-catalog"], queryFn: getConnectorCatalog });
  const enabled = useQuery({ queryKey: ["connectors-enabled"], queryFn: getEnabledConnectors });
  const issueSync = useQuery({ queryKey: ["issue-sync-connections"], queryFn: getIssueSyncConnections });
  const siem = useQuery({ queryKey: ["siem-config"], queryFn: getSiemConfig });
  const email = useQuery({ queryKey: ["email-config"], queryFn: getEmailConfig });

  return { catalog, enabled, issueSync, siem, email };
}

export type IntegrationsData = ReturnType<typeof useIntegrations>;
