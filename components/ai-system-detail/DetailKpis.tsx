"use client";

import { Gauge, ShieldAlert, FlaskConical, Activity, Waves, Cpu } from "lucide-react";
import { DetailKpi } from "@/components/ai-system-detail/DetailKpi";
import { pickScore } from "@/lib/hooks/useCommandCenter";
import { getNumberFromPaths } from "@/lib/api/normalizers";
import { normalizeSystemProfile, normalizeTelemetry } from "@/lib/api/ai-system-detail-normalizers";
import type { AiSystemDetail } from "@/lib/hooks/useAiSystemDetail";

const sevTone: Record<string, "good" | "warn" | "bad" | "neutral"> = {
  critical: "bad",
  high: "bad",
  medium: "warn",
  low: "good",
  info: "neutral"
};

export function DetailKpis({ data }: { data: AiSystemDetail }) {
  const { detail, dashboard, testing, reliability, drift } = data;
  const profile = normalizeSystemProfile(detail.data, dashboard.data);

  const governance = profile.score ?? pickScore([dashboard.data, detail.data], ["governance_score", "score", "overall_score"]);
  const coverage = getNumberFromPaths(testing.data, [
    "coverage",
    "test_coverage",
    "coverage_pct",
    "tests_coverage",
    "passed_percentage"
  ]);
  const rel = normalizeTelemetry(reliability.data, "reliability");
  const driftT = normalizeTelemetry(drift.data, "drift");
  const monitoring = pickScore([reliability.data, dashboard.data], ["monitoring_health", "health", "uptime", "availability"]) ?? rel.value;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <DetailKpi
        label="Governance Score"
        icon={Gauge}
        accent="purple"
        value={governance}
        suffix={governance != null ? "/100" : ""}
        scoreToneFor={governance}
        loading={detail.isLoading && dashboard.isLoading}
        unavailableHint="No score"
      />
      <DetailKpi
        label="Risk Level"
        icon={ShieldAlert}
        accent="red"
        text={profile.hasRisk ? profile.riskLevel : null}
        textTone={sevTone[profile.riskLevel]}
        loading={detail.isLoading}
        unavailableHint="Not rated"
      />
      <DetailKpi
        label="Test Coverage"
        icon={FlaskConical}
        accent="cyan"
        value={coverage}
        suffix={coverage != null ? "%" : ""}
        scoreToneFor={coverage}
        loading={testing.isLoading}
        unavailableHint="No tests"
      />
      <DetailKpi
        label="Monitoring Health"
        icon={Activity}
        accent="teal"
        value={monitoring}
        suffix={monitoring != null ? "%" : ""}
        scoreToneFor={monitoring}
        loading={reliability.isLoading && dashboard.isLoading}
        unavailableHint="No data"
      />
      <DetailKpi
        label="Drift Status"
        icon={Waves}
        accent="amber"
        text={driftT.status}
        textTone={driftT.status && /stable|low|none|ok/i.test(driftT.status) ? "good" : driftT.status ? "warn" : "neutral"}
        loading={drift.isLoading}
        unavailableHint="No drift data"
      />
      <DetailKpi
        label="Reliability"
        icon={Cpu}
        accent="blue"
        value={rel.value}
        suffix={rel.value != null ? "%" : ""}
        scoreToneFor={rel.value}
        loading={reliability.isLoading}
        unavailableHint="No data"
      />
    </div>
  );
}
