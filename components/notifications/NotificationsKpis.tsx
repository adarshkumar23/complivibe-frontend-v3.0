"use client";

import { Inbox, Flame, BellRing, BellOff } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import type { NotificationsData } from "@/lib/hooks/useNotifications";

export function NotificationsKpis({ data }: { data: NotificationsData }) {
  const { inbox, preferences } = data;
  const total = inbox.data?.total_items ?? null;
  const urgent = inbox.data ? inbox.data.items.filter((i) => i.priority_score >= 100).length : null;
  const prefs = preferences.data;
  const enabled = prefs ? prefs.filter((p) => p.is_enabled).length : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi
        label="Inbox Items"
        icon={Inbox}
        accent="blue"
        value={total}
        caption={total === 0 ? "nothing needs your attention" : undefined}
        loading={inbox.isLoading}
        unavailableHint="Inbox unavailable"
      />
      <RegistryKpi
        label="High Priority"
        icon={Flame}
        accent="red"
        value={urgent}
        caption={urgent != null && urgent > 0 ? "handle these first" : undefined}
        loading={inbox.isLoading}
        unavailableHint="Inbox unavailable"
      />
      <RegistryKpi
        label="Channels Enabled"
        icon={BellRing}
        accent="green"
        value={enabled}
        caption={prefs ? `of ${prefs.length} notification rules` : undefined}
        loading={preferences.isLoading}
        unavailableHint="Preferences unavailable"
      />
      <RegistryKpi
        label="Muted Rules"
        icon={BellOff}
        accent="amber"
        value={prefs && enabled != null ? prefs.length - enabled : null}
        loading={preferences.isLoading}
        unavailableHint="Preferences unavailable"
      />
    </div>
  );
}
