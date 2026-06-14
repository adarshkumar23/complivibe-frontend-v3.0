"use client";

import { Plug, Boxes, RefreshCw, AlertTriangle } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { normalizeIntegrations, isConnected, normalizeSyncLogs, syncFailed } from "@/lib/api/integration-normalizers";
import type { IntegrationsData } from "@/lib/hooks/useIntegrations";

export function IntegrationsKpis({ data }: { data: IntegrationsData }) {
  const { integrations, syncLogs } = data;
  const list = integrations.isSuccess ? normalizeIntegrations(integrations.data) : null;

  // Connected only counts entries the backend marks connected/active/configured.
  const anyStatus = list ? list.some((i) => i.status) : false;
  const connected = list && anyStatus ? list.filter((i) => isConnected(i.status)).length : null;
  const configured = list ? list.length : null;

  const logs = syncLogs.isSuccess ? normalizeSyncLogs(syncLogs.data) : null;
  const recentSyncs = logs ? logs.length : null;
  const anyLogStatus = logs ? logs.some((l) => l.status) : false;
  const failedSyncs = logs && anyLogStatus ? logs.filter((l) => syncFailed(l.status)).length : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi label="Connected Integrations" icon={Plug} accent="green" value={connected} caption={connected != null ? "active connections" : undefined} loading={integrations.isLoading} unavailableHint="No status field" />
      <RegistryKpi label="Configured Providers" icon={Boxes} accent="blue" value={configured} caption={configured != null ? "in registry" : undefined} loading={integrations.isLoading} unavailableHint="Integrations unavailable" />
      <RegistryKpi label="Recent Syncs" icon={RefreshCw} accent="purple" value={recentSyncs} caption={recentSyncs != null ? "logged events" : undefined} loading={syncLogs.isLoading} unavailableHint="Sync logs unavailable" />
      <RegistryKpi label="Failed Syncs" icon={AlertTriangle} accent="red" value={failedSyncs} caption={failedSyncs != null ? "need attention" : undefined} loading={syncLogs.isLoading} unavailableHint="No sync status" />
    </div>
  );
}
