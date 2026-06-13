"use client";

import { Boxes, ShieldAlert, Gauge, Activity } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { pickScore } from "@/lib/hooks/useCommandCenter";
import type { AiSystemsData } from "@/lib/hooks/useAiSystems";
import {
  normalizeAiSystems,
  averageScore,
  isActiveMonitoring
} from "@/lib/api/ai-system-normalizers";

export function AiSystemsKpis({ data }: { data: AiSystemsData }) {
  const { systems, governanceSummary, governanceScore } = data;
  const list = normalizeAiSystems(systems.data);
  const ok = systems.isSuccess;
  const loading = systems.isLoading;

  const total = ok ? list.length : null;
  const highRisk = ok ? list.filter((s) => s.riskLevel === "critical" || s.riskLevel === "high").length : null;

  // Average governance score: from real system scores, else governance endpoints
  const avg =
    averageScore(list) ??
    pickScore(
      [governanceScore.data, governanceSummary.data],
      ["governance_score", "ai_governance_score", "average_score", "avg_governance_score", "overall_score", "score"]
    );

  // Active monitoring: real lifecycle field required, otherwise unavailable
  const anyLifecycle = list.some((s) => s.lifecycleStage != null);
  const active = ok && anyLifecycle ? list.filter((s) => isActiveMonitoring(s.lifecycleStage)).length : null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi
        label="Total AI Systems"
        icon={Boxes}
        accent="blue"
        value={total}
        caption={total != null ? "in registry" : undefined}
        loading={loading}
        unavailableHint="Registry unavailable"
      />
      <RegistryKpi
        label="High-Risk Systems"
        icon={ShieldAlert}
        accent="red"
        value={highRisk}
        caption={highRisk != null ? "critical or high" : undefined}
        loading={loading}
        unavailableHint="Registry unavailable"
      />
      <RegistryKpi
        label="Average Governance Score"
        icon={Gauge}
        accent="purple"
        value={avg}
        suffix={avg != null ? "/100" : ""}
        scoreToneFor={avg}
        caption={avg != null ? "across scored systems" : undefined}
        loading={loading && governanceScore.isLoading}
        unavailableHint="No score returned"
      />
      <RegistryKpi
        label="Active Monitoring"
        icon={Activity}
        accent="teal"
        value={active}
        caption={active != null ? "in production / live" : undefined}
        loading={loading}
        unavailableHint="No lifecycle field"
      />
    </div>
  );
}
