"use client";

import { Waves, Radar, Flame, ClipboardCheck } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { normalizeTelemetry, driftDetail, isHighRiskDrift, driftTone, normalizeDriftSignals } from "@/lib/api/drift-normalizers";
import type { DriftData } from "@/lib/hooks/useDrift";

export function DriftKpis({ data }: { data: DriftData }) {
  const { systems, list, driftById, anyDrift, driftLoading } = data;
  const loading = systems.isLoading || driftLoading;

  const details = list
    .map((s) => {
      const e = s.rawId ? driftById.get(s.rawId) : undefined;
      if (!e?.isSuccess) return null;
      const base = normalizeTelemetry(e.data, "drift");
      return { detail: driftDetail(e.data, base.value, base.status), signals: normalizeDriftSignals(e.data, s.name).length };
    })
    .filter((x): x is { detail: ReturnType<typeof driftDetail>; signals: number } => x != null);

  const monitored = systems.isSuccess && anyDrift
    ? details.filter((d) => d.detail.score != null || d.detail.status != null).length
    : null;
  const signalsDetected = anyDrift ? details.reduce((sum, d) => sum + d.signals, 0) : null;
  const highRisk = anyDrift ? details.filter((d) => isHighRiskDrift(d.detail)).length : null;
  const needsReview = anyDrift ? details.filter((d) => driftTone(d.detail) === "bad" || driftTone(d.detail) === "warn").length : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi label="Systems Monitored" icon={Waves} accent="blue" value={monitored} caption={monitored != null ? "with drift telemetry" : undefined} loading={loading} unavailableHint="Drift unavailable" />
      <RegistryKpi label="Drift Signals" icon={Radar} accent="purple" value={signalsDetected} caption={signalsDetected != null ? "detected" : undefined} loading={loading} unavailableHint="No signals" />
      <RegistryKpi label="High-Risk Drift" icon={Flame} accent="red" value={highRisk} caption={highRisk != null ? "backend-flagged" : undefined} loading={loading} unavailableHint="No drift status" />
      <RegistryKpi label="Systems Needing Review" icon={ClipboardCheck} accent="amber" value={needsReview} caption={needsReview != null ? "drifting" : undefined} loading={loading} unavailableHint="No drift status" />
    </div>
  );
}
