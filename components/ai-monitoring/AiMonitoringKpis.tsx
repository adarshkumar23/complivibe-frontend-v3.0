"use client";

import { Activity, Bell, Siren, Gauge } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { normalizeAlerts } from "@/lib/api/normalizers";
import { normalizeIncidents, isResolved } from "@/lib/api/incident-normalizers";
import { normalizeTelemetry, isActiveMonitoring } from "@/lib/api/ai-monitoring-normalizers";
import type { AiMonitoringData } from "@/lib/hooks/useAiMonitoring";

export function AiMonitoringKpis({ data }: { data: AiMonitoringData }) {
  const { systems, alerts, incidents, list, reliabilityById, anyReliability, telemetryLoading } = data;

  // Monitored = systems the backend marks in an active/monitoring lifecycle stage.
  const anyStage = list.some((s) => s.lifecycleStage);
  const monitored = systems.isSuccess && anyStage ? list.filter((s) => isActiveMonitoring(s.lifecycleStage)).length : null;

  const activeAlerts = alerts.isSuccess ? normalizeAlerts(undefined, alerts.data).length : null;
  const openIncidents = incidents.isSuccess ? normalizeIncidents(incidents.data).filter((i) => !isResolved(i.status)).length : null;

  // Reliability signals = systems that returned a real reliability value.
  const reliabilitySignals = anyReliability
    ? list.filter((s) => {
        const e = s.rawId ? reliabilityById.get(s.rawId) : undefined;
        return e?.isSuccess && normalizeTelemetry(e.data, "reliability").value != null;
      }).length
    : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi label="Monitored AI Systems" icon={Activity} accent="blue" value={monitored} caption={monitored != null ? "in active stage" : undefined} loading={systems.isLoading} unavailableHint="No lifecycle data" />
      <RegistryKpi label="Active Alerts" icon={Bell} accent="amber" value={activeAlerts} caption={activeAlerts != null ? "predictive signals" : undefined} loading={alerts.isLoading} unavailableHint="Alerts unavailable" />
      <RegistryKpi label="Open Incidents" icon={Siren} accent="red" value={openIncidents} caption={openIncidents != null ? "unresolved" : undefined} loading={incidents.isLoading} unavailableHint="Incidents unavailable" />
      <RegistryKpi label="Reliability Signals" icon={Gauge} accent="green" value={reliabilitySignals} caption={reliabilitySignals != null ? "systems reporting" : undefined} loading={systems.isLoading || telemetryLoading} unavailableHint="Telemetry unavailable" />
    </div>
  );
}
