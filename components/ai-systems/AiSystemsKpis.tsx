"use client";

import { BrainCircuit, UserX, Gauge, ShieldQuestion } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import type { AiSystemsData } from "@/lib/hooks/useAiSystems";

export function AiSystemsKpis({ data }: { data: AiSystemsData }) {
  const { summary, dashboard } = data;
  const s = summary.data;
  const d = dashboard.data;

  // A metric listed in unavailable_metrics failed server-side; its 0 is a
  // placeholder and must render as "Unavailable", not a real value.
  const unavailable = new Set(d?.unavailable_metrics ?? []);
  const tierUnavailable = unavailable.has("ai_systems_by_tier");
  const coverageUnavailable = unavailable.has("governance_coverage_pct");
  const reviewsUnavailable = unavailable.has("outstanding_reviews_count");

  const unassessed = d && !tierUnavailable ? (d.ai_systems_by_tier["unassessed"] ?? 0) : null;
  const production = s ? (s.by_lifecycle_status["production"] ?? 0) : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi
        label="AI Systems"
        icon={BrainCircuit}
        accent="purple"
        value={s ? s.active_systems : null}
        caption={production != null ? `${production} in production` : undefined}
        loading={summary.isLoading}
        unavailableHint="Registry summary unavailable"
      />
      <RegistryKpi
        label="Unassessed Risk Tier"
        icon={ShieldQuestion}
        accent="amber"
        value={unassessed}
        caption={
          unassessed != null && unassessed > 0
            ? "run risk classification for these systems"
            : unassessed === 0
              ? "all systems tiered"
              : undefined
        }
        loading={dashboard.isLoading}
        unavailableHint={tierUnavailable ? "Metric unavailable — query failed" : "Governance dashboard unavailable"}
      />
      <RegistryKpi
        label="Governance Coverage"
        icon={Gauge}
        accent="teal"
        value={d && !coverageUnavailable ? Math.round(d.governance_coverage_pct) : null}
        caption={
          d && !coverageUnavailable
            ? reviewsUnavailable
              ? "reviews outstanding: unavailable"
              : `${d.outstanding_reviews_count} reviews outstanding`
            : undefined
        }
        loading={dashboard.isLoading}
        unavailableHint={coverageUnavailable ? "Metric unavailable — query failed" : "Governance dashboard unavailable"}
      />
      <RegistryKpi
        label="Missing Technical Owner"
        icon={UserX}
        accent="red"
        value={s ? s.total_systems - s.with_technical_owner : null}
        caption={
          s
            ? s.total_systems - s.with_technical_owner > 0
              ? "no one accountable for model changes"
              : "every system has a technical owner"
            : undefined
        }
        loading={summary.isLoading}
        unavailableHint="Registry summary unavailable"
      />
    </div>
  );
}
