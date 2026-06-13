"use client";

import { HeartPulse, Clock4, Workflow, BellRing, ShieldAlert } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { pickScore } from "@/lib/hooks/useCommandCenter";
import {
  normalizePipelines,
  sensitiveSignals,
  averageReliability
} from "@/lib/api/data-observability-normalizers";
import { normalizeList } from "@/lib/api/normalizers";
import type { DataObservability } from "@/lib/hooks/useDataObservability";

export function DataObsKpis({ data }: { data: DataObservability }) {
  const { overview, quality, freshness, pipelines, sensitive } = data;

  const dataHealth = pickScore(
    [overview.data, quality.data],
    ["data_health", "data_health_score", "health_score", "overall_score", "overall", "score"]
  );

  const freshnessCoverage = pickScore(
    [freshness.data, overview.data],
    ["freshness_coverage", "coverage", "fresh_percentage", "freshness_score", "fresh_pct", "coverage_percentage"]
  );

  const reliability =
    averageReliability(normalizePipelines(pipelines.data)) ??
    pickScore([overview.data, pipelines.data], ["pipeline_reliability", "reliability", "success_rate", "uptime"]);

  // Active alerts: real count from alert-shaped arrays
  const alertCount = (() => {
    const fromOverview = normalizeList(overview.data, ["alerts", "active_alerts", "issues", "incidents"]).length;
    const fromFreshness = normalizeList(freshness.data, ["alerts", "stale", "issues"]).length;
    const total = fromOverview + fromFreshness;
    if (total > 0) return total;
    return overview.isSuccess || freshness.isSuccess
      ? pickScore([overview.data], ["active_alerts", "alerts_count", "alert_count"])
      : null;
  })();

  const signals = sensitiveSignals(sensitive.data);
  const sensitiveFindings = (() => {
    if (!sensitive.isSuccess) return null;
    if (signals.pii != null) return signals.pii;
    const count = normalizeList(sensitive.data, ["findings", "items", "results", "sensitive_data"]).length;
    return count > 0 ? count : null;
  })();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <RegistryKpi
        label="Data Health Score"
        icon={HeartPulse}
        accent="cyan"
        value={dataHealth}
        suffix={dataHealth != null ? "/100" : ""}
        scoreToneFor={dataHealth}
        caption={dataHealth != null ? "overall data trust" : undefined}
        loading={overview.isLoading && quality.isLoading}
        unavailableHint="No score returned"
      />
      <RegistryKpi
        label="Freshness Coverage"
        icon={Clock4}
        accent="blue"
        value={freshnessCoverage}
        suffix={freshnessCoverage != null ? "%" : ""}
        scoreToneFor={freshnessCoverage}
        caption={freshnessCoverage != null ? "datasets fresh" : undefined}
        loading={freshness.isLoading}
        unavailableHint="Backend field missing"
      />
      <RegistryKpi
        label="Pipeline Reliability"
        icon={Workflow}
        accent="purple"
        value={reliability}
        suffix={reliability != null ? "%" : ""}
        scoreToneFor={reliability}
        caption={reliability != null ? "successful runs" : undefined}
        loading={pipelines.isLoading}
        unavailableHint="Backend field missing"
      />
      <RegistryKpi
        label="Active Alerts"
        icon={BellRing}
        accent="amber"
        value={alertCount}
        caption={alertCount != null ? "open data alerts" : undefined}
        loading={overview.isLoading && freshness.isLoading}
        unavailableHint="No alerts field"
      />
      <RegistryKpi
        label="Sensitive Findings"
        icon={ShieldAlert}
        accent="red"
        value={sensitiveFindings}
        caption={sensitiveFindings != null ? "PII / exposure" : undefined}
        loading={sensitive.isLoading}
        unavailableHint="No findings field"
      />
    </div>
  );
}
