"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getConnectorCatalog,
  getEnabledConnectors,
  getIssueSyncConnections,
  getSiemConfig,
  getEmailConfig,
  enableConnector,
  disableConnector
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

function useInvalidateConnectors() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["connectors-enabled"] });
    qc.invalidateQueries({ queryKey: ["connector-catalog"] });
  };
}

export function useEnableConnector() {
  const invalidate = useInvalidateConnectors();
  return useMutation({
    mutationFn: ({ connectorId, config }: { connectorId: string; config?: Record<string, unknown> | null }) => enableConnector(connectorId, config),
    onSuccess: invalidate
  });
}
export function useDisableConnector() {
  const invalidate = useInvalidateConnectors();
  return useMutation({ mutationFn: (connectorId: string) => disableConnector(connectorId), onSuccess: invalidate });
}
