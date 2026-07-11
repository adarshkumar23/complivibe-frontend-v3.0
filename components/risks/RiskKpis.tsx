"use client";

import { TriangleAlert, Flame, Unlink, CalendarClock } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import type { RisksData } from "@/lib/hooks/useRisks";

export function RiskKpis({ data }: { data: RisksData }) {
  const { summary } = data;
  const s = summary.data;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi
        label="Open Risks"
        icon={TriangleAlert}
        accent="blue"
        value={s ? s.open_risks : null}
        caption={s ? `${s.total_risks} total · ${s.mitigated_risks} mitigated · ${s.accepted_risks} accepted` : undefined}
        loading={summary.isLoading}
        unavailableHint="Risk summary unavailable"
      />
      <RegistryKpi
        label="Critical & High"
        icon={Flame}
        accent="red"
        value={s ? s.critical_risks + s.high_risks : null}
        caption={s ? `${s.critical_risks} critical · ${s.high_risks} high` : undefined}
        loading={summary.isLoading}
        unavailableHint="Risk summary unavailable"
      />
      <RegistryKpi
        label="Without Mitigating Controls"
        icon={Unlink}
        accent="amber"
        value={s ? s.risks_without_controls : null}
        caption={
          s
            ? s.risks_without_controls > 0
              ? "link controls to reduce residual risk"
              : "all risks have controls"
            : undefined
        }
        loading={summary.isLoading}
        unavailableHint="Risk summary unavailable"
      />
      <RegistryKpi
        label="Overdue Reviews"
        icon={CalendarClock}
        accent="purple"
        value={s ? s.overdue_risk_reviews : null}
        caption={
          s
            ? s.risks_without_owner > 0
              ? `${s.risks_without_owner} risks also lack an owner`
              : "all risks have owners"
            : undefined
        }
        loading={summary.isLoading}
        unavailableHint="Risk summary unavailable"
      />
    </div>
  );
}
