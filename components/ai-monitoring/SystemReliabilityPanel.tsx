"use client";

import { Gauge } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { ScoreRing } from "@/components/charts/ScoreRing";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeTelemetry } from "@/lib/api/ai-monitoring-normalizers";
import type { AiMonitoringData } from "@/lib/hooks/useAiMonitoring";

export function SystemReliabilityPanel({ data }: { data: AiMonitoringData }) {
  const { list, reliabilityById, telemetryLoading, anyReliability, systems } = data;

  // Real reliability values only — averaged across systems that report one.
  const values: number[] = [];
  for (const s of list) {
    const e = s.rawId ? reliabilityById.get(s.rawId) : undefined;
    if (!e?.isSuccess) continue;
    const v = normalizeTelemetry(e.data, "reliability").value;
    if (v != null) values.push(v);
  }
  const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;

  return (
    <SectionCard title="System Reliability" subtitle="Average reliability across reporting systems" icon={Gauge} accent="teal" className="h-full">
      {systems.isLoading || telemetryLoading ? (
        <SkeletonRows rows={4} />
      ) : !anyReliability || avg == null ? (
        <EmptyState icon={Gauge} title="Reliability telemetry unavailable from backend." description="Reliability and uptime signals will appear here once telemetry endpoints return data." />
      ) : (
        <div className="flex flex-col items-center gap-4">
          <ScoreRing value={avg} size={130} label="Avg reliability" />
          <p className="text-[11px] font-medium text-cv-slate">{values.length} system{values.length === 1 ? "" : "s"} reporting reliability telemetry</p>
        </div>
      )}
    </SectionCard>
  );
}
