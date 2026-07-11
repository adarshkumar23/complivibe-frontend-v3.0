"use client";

import { Bot, ClipboardList, Stamp, ShieldAlert } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import type { AutopilotData } from "@/lib/hooks/useAutopilot";

export function AutopilotKpis({ data }: { data: AutopilotData }) {
  const { summary, intents, approvals } = data;
  const s = summary.data;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi
        label="Active Policies"
        icon={Bot}
        accent="purple"
        value={s ? s.active_policies : null}
        caption={s ? `mode: ${s.resolved_mode.replaceAll("_", " ")}` : undefined}
        loading={summary.isLoading}
        unavailableHint="Autopilot summary unavailable"
      />
      <RegistryKpi
        label="Pending Intents"
        icon={ClipboardList}
        accent="blue"
        value={intents.data ? intents.data.pending_intents : null}
        caption={
          intents.data
            ? intents.data.stale_pending_intents > 0
              ? `${intents.data.stale_pending_intents} stale — review or discard`
              : `${intents.data.total_intents} total planned`
            : undefined
        }
        loading={intents.isLoading}
        unavailableHint="Intent summary unavailable"
      />
      <RegistryKpi
        label="Awaiting Approval"
        icon={Stamp}
        accent="amber"
        value={approvals.data ? approvals.data.approval_required_count : null}
        caption={
          approvals.data ? `${approvals.data.ready_for_runner_count} approved and ready to run` : undefined
        }
        loading={approvals.isLoading}
        unavailableHint="Approval summary unavailable"
      />
      <RegistryKpi
        label="Open Critical Signals"
        icon={ShieldAlert}
        accent="red"
        value={s ? s.open_critical_signals : null}
        caption={
          s
            ? s.external_effects_allowed
              ? "external effects ENABLED"
              : "external effects disabled (safe default)"
            : undefined
        }
        loading={summary.isLoading}
        unavailableHint="Autopilot summary unavailable"
      />
    </div>
  );
}
