"use client";

import { Waves, PlugZap, TriangleAlert } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import type { DriftData } from "@/lib/hooks/useDrift";

export function DriftKpis({ data }: { data: DriftData }) {
  const { connection, drift } = data;
  const connected = connection.isSuccess ? connection.data != null : null;
  const entries = drift.data ?? [];
  const detected = drift.isSuccess ? entries.filter((e) => e.drift_detected).length : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <RegistryKpi
        label="MLflow Connection"
        icon={PlugZap}
        accent={connected ? "green" : "amber"}
        value={connected == null ? null : connected ? 1 : 0}
        caption={connected == null ? undefined : connected ? "tracking server linked" : "connect MLflow to enable drift detection"}
        loading={connection.isLoading}
        unavailableHint="Connection status unavailable"
      />
      <RegistryKpi
        label="Models Monitored"
        icon={Waves}
        accent="blue"
        value={drift.isSuccess ? entries.length : null}
        caption={drift.isSuccess && entries.length === 0 ? "no drift checks recorded yet" : undefined}
        loading={drift.isLoading}
        unavailableHint="Drift data unavailable"
      />
      <RegistryKpi
        label="Drift Detected"
        icon={TriangleAlert}
        accent="red"
        value={detected}
        caption={detected != null && detected > 0 ? "investigate affected models" : detected === 0 ? "no statistically significant drift" : undefined}
        loading={drift.isLoading}
        unavailableHint="Drift data unavailable"
      />
    </div>
  );
}
