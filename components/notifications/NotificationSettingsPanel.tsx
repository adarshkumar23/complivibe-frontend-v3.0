"use client";

import { Settings2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import type { NotificationsData } from "@/lib/hooks/useNotifications";

/** Per-type channel rules from GET /api/v1/preferences/notifications. */
export function NotificationSettingsPanel({ data }: { data: NotificationsData }) {
  const { preferences } = data;
  const list = preferences.data ?? [];

  return (
    <SectionCard title="Notification Rules" subtitle="Per-event channel preferences" icon={Settings2} accent="purple">
      {preferences.isLoading ? (
        <SkeletonRows rows={5} />
      ) : preferences.isError ? (
        <ErrorState compact title="Unable to load preferences" onRetry={() => preferences.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState compact icon={Settings2} title="No rules configured" description="Notification rules will list here." />
      ) : (
        <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-1" tabIndex={0} aria-label="Notification rules">
          {list.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-cv-ink">{p.notification_type.replaceAll("_", " ")}</p>
                <p className="text-[10px] text-cv-mist">{p.channel}</p>
              </div>
              <StatusBadge label={p.is_enabled ? "On" : "Off"} tone={p.is_enabled ? "good" : "neutral"} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
