"use client";

import { Gauge, LayoutGrid, TriangleAlert, CalendarClock } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import type { ExecutiveData } from "@/lib/hooks/useExecutiveSummary";

export function ExecutiveKpis({ data }: { data: ExecutiveData }) {
  const { summary, posture } = data;
  const s = summary.data;
  const p = posture.data;

  const criticalRisks = p ? p.risks.by_severity.critical + p.risks.by_severity.high : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi
        label="Compliance Score"
        icon={Gauge}
        accent="blue"
        value={s?.current_score ?? null}
        caption={s && s.current_score == null ? "no score snapshot computed yet" : s?.current_score_grade ? `grade ${s.current_score_grade}` : undefined}
        loading={summary.isLoading}
        unavailableHint="Score not yet computed"
      />
      <RegistryKpi
        label="Active Frameworks"
        icon={LayoutGrid}
        accent="purple"
        value={p ? p.active_frameworks.count : null}
        caption={p ? `${p.obligations.applicable} applicable obligations` : undefined}
        loading={posture.isLoading}
        unavailableHint="Posture summary unavailable"
      />
      <RegistryKpi
        label="Critical & High Risks"
        icon={TriangleAlert}
        accent="red"
        value={criticalRisks}
        caption={p ? `${p.risks.total} total risks · ${p.risks.open_treatments} open treatments` : undefined}
        loading={posture.isLoading}
        unavailableHint="Posture summary unavailable"
      />
      <RegistryKpi
        label="Deadlines ≤ 30d"
        icon={CalendarClock}
        accent="amber"
        value={p ? p.deadlines.upcoming_30_days : null}
        caption={p && p.deadlines.overdue > 0 ? `${p.deadlines.overdue} already overdue` : undefined}
        loading={posture.isLoading}
        unavailableHint="Posture summary unavailable"
      />
    </div>
  );
}
