"use client";

import { Zap, PlayCircle, XCircle, Hourglass } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import type { AutomationData } from "@/lib/hooks/useAutomation";

export function AutomationKpis({ data }: { data: AutomationData }) {
  const { summary } = data;
  const s = summary.data;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi
        label="Active Rules"
        icon={Zap}
        accent="blue"
        value={s ? s.active_rules : null}
        caption={s ? `${s.inactive_rules} inactive · ${s.archived_rules} archived` : undefined}
        loading={summary.isLoading}
        unavailableHint="Automation summary unavailable"
      />
      <RegistryKpi
        label="Executions (24h)"
        icon={PlayCircle}
        accent="teal"
        value={s ? s.executions_last_24h : null}
        caption={s ? `${s.actions_created_last_24h} actions created` : undefined}
        loading={summary.isLoading}
        unavailableHint="Automation summary unavailable"
      />
      <RegistryKpi
        label="Failed Actions (24h)"
        icon={XCircle}
        accent="red"
        value={s ? s.failed_actions_last_24h : null}
        caption={s ? `${Math.round(s.execution_error_rate_last_24h * 100)}% error rate` : undefined}
        loading={summary.isLoading}
        unavailableHint="Automation summary unavailable"
      />
      <RegistryKpi
        label="Stale / Overdue Rules"
        icon={Hourglass}
        accent="amber"
        value={s ? s.stale_active_rules + s.active_scheduled_rules_overdue : null}
        caption={
          s
            ? s.active_scheduled_rules_overdue > 0
              ? `${s.active_scheduled_rules_overdue} scheduled rules overdue`
              : "schedules on time"
            : undefined
        }
        loading={summary.isLoading}
        unavailableHint="Automation summary unavailable"
      />
    </div>
  );
}
