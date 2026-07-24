"use client";

import { useState } from "react";
import { Settings2, Loader2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { ApiError } from "@/lib/api/client";
import { type NotificationsData, useUpdateNotificationPreference } from "@/lib/hooks/useNotifications";
import type { NotificationPreference } from "@/lib/api/notifications";

function PreferenceToggle({ p }: { p: NotificationPreference }) {
  const update = useUpdateNotificationPreference();
  const [error, setError] = useState<string | null>(null);
  async function onToggle() {
    setError(null);
    try {
      await update.mutateAsync({
        notificationType: p.notification_type,
        channel: p.channel,
        isEnabled: !p.is_enabled,
        minSeverity: p.min_severity
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not update.");
    }
  }
  return (
    <div className="flex shrink-0 flex-col items-end gap-0.5">
      <button
        type="button"
        role="switch"
        aria-checked={p.is_enabled}
        aria-label={`Toggle ${p.notification_type.replaceAll("_", " ")}`}
        data-testid={`notif-toggle-${p.notification_type}`}
        data-enabled={p.is_enabled}
        disabled={update.isPending}
        onClick={onToggle}
        className={`cv-ring-focus relative inline-flex h-5 w-9 items-center rounded-full transition disabled:opacity-60 ${p.is_enabled ? "bg-cv-brand" : "bg-cv-mist/40"}`}
      >
        <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full bg-white shadow transition ${p.is_enabled ? "translate-x-4" : "translate-x-0.5"}`}>
          {update.isPending ? <Loader2 size={9} className="animate-spin text-cv-slate" /> : null}
        </span>
      </button>
      {error ? <span className="text-[9px] font-semibold text-rose-600">{error}</span> : null}
    </div>
  );
}

/** Per-type channel rules from GET /api/v1/preferences/notifications, with live toggles. */
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
              <PreferenceToggle p={p} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
