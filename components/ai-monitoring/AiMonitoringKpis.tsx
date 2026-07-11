"use client";

import { Activity, Siren, Hourglass, Radio } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import type { AiMonitoringData } from "@/lib/hooks/useAiMonitoring";

export function AiMonitoringKpis({ data }: { data: AiMonitoringData }) {
  const { summary, events } = data;
  const s = summary.data;
  const e = events.data;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi
        label="Open Signals"
        icon={Radio}
        accent="blue"
        value={s ? s.open_signals : null}
        caption={s ? `${s.total_signals} total · ${s.resolved_signals} resolved` : undefined}
        loading={summary.isLoading}
        unavailableHint="Signal summary unavailable"
      />
      <RegistryKpi
        label="Open Critical Signals"
        icon={Siren}
        accent="red"
        value={s ? s.open_critical_signals : null}
        caption={
          s
            ? s.open_high_or_urgent_priority_signals > 0
              ? `${s.open_high_or_urgent_priority_signals} high/urgent priority open`
              : "no high-priority backlog"
            : undefined
        }
        loading={summary.isLoading}
        unavailableHint="Signal summary unavailable"
      />
      <RegistryKpi
        label="Stale Open Signals"
        icon={Hourglass}
        accent="amber"
        value={s ? s.stale_open_signals : null}
        caption={
          s && s.oldest_open_signal_age_days != null
            ? `oldest open signal is ${s.oldest_open_signal_age_days}d old`
            : s
              ? "no aging backlog"
              : undefined
        }
        loading={summary.isLoading}
        unavailableHint="Signal summary unavailable"
      />
      <RegistryKpi
        label="Events (30d)"
        icon={Activity}
        accent="purple"
        value={e ? e.total_events_30d : null}
        caption={e && e.total_events_30d === 0 ? "no governance events recorded" : undefined}
        loading={events.isLoading}
        unavailableHint="Event summary unavailable"
      />
    </div>
  );
}
