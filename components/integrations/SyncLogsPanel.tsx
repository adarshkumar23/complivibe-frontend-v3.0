"use client";

import { ScrollText, Activity } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeSyncLogs, statusTone } from "@/lib/api/integration-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { IntegrationsData } from "@/lib/hooks/useIntegrations";

export function SyncLogsPanel({ data }: { data: IntegrationsData }) {
  const { syncLogs } = data;
  const logs = normalizeSyncLogs(syncLogs.data);

  return (
    <SectionCard title="Sync Activity" subtitle="Integration sync & event logs" icon={ScrollText} accent="cyan" className="h-full">
      {syncLogs.isLoading ? (
        <SkeletonRows rows={5} />
      ) : syncLogs.isError ? (
        <EmptyState icon={Activity} title="Sync logs unavailable" description="The sync-logs endpoint is not available on this backend yet." />
      ) : logs.length === 0 ? (
        <EmptyState icon={Activity} title="No sync activity" description="Integration sync events will appear here once the backend records them." />
      ) : (
        <ul className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
          {logs.slice(0, 14).map((l) => (
            <li key={l.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{[l.provider, l.action].filter(Boolean).join(" · ") || "Sync event"}</p>
                <p className="truncate text-[11px] text-cv-slate">{[l.message, formatRelativeTime(l.timestamp)].filter(Boolean).join(" · ") || "—"}</p>
              </div>
              {l.status ? <StatusBadge label={l.status} tone={statusTone(l.status)} /> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
