"use client";

import { History, Activity } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeComplianceActivity } from "@/lib/api/compliance-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { AlertsData } from "@/lib/hooks/useAlerts";

export function RecentAlertActivity({ data }: { data: AlertsData }) {
  const { feed } = data;
  const events = normalizeComplianceActivity(feed.data).slice(0, 6);

  return (
    <SectionCard title="Recent Activity" subtitle="From the control-center feed" icon={History} accent="cyan" className="h-full">
      {feed.isLoading ? (
        <SkeletonRows rows={4} />
      ) : feed.isError ? (
        <ErrorState compact title="Unable to load activity" onRetry={() => feed.refetch()} />
      ) : events.length === 0 ? (
        <EmptyState compact icon={Activity} title="No recent activity" description="Governance and alert events will stream here from the control-center feed." />
      ) : (
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={e.id} className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cv-brand" />
              <div className="min-w-0">
                <p className="line-clamp-2 text-[13px] font-medium text-cv-ink">{e.title}</p>
                <p className="text-[11px] text-cv-mist">{[e.type, e.status, formatRelativeTime(e.timestamp)].filter(Boolean).join(" · ") || "—"}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
