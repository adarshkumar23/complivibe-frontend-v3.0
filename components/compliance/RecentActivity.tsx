"use client";

import { History, Activity } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeComplianceActivity } from "@/lib/api/compliance-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { Compliance } from "@/lib/hooks/useCompliance";

export function RecentActivity({ data }: { data: Compliance }) {
  const { feed, overview, certifications } = data;
  // Primary source: enterprise control-center feed; overview/certifications kept as fallbacks.
  const items = normalizeComplianceActivity(feed.data, overview.data, certifications.data).slice(0, 5);
  const loading = feed.isLoading || overview.isLoading;
  const errored = feed.isError && overview.isError && certifications.isError;

  return (
    <SectionCard title="Recent Compliance Activity" subtitle="Latest changes & events" icon={History} accent="cyan">
      {loading ? (
        <SkeletonRows rows={4} />
      ) : errored ? (
        <ErrorState
          compact
          title="Unable to load activity"
          onRetry={() => {
            feed.refetch();
            overview.refetch();
          }}
        />
      ) : items.length === 0 ? (
        <EmptyState
          compact
          icon={Activity}
          title="No recent activity"
          description="Compliance events, approvals, and updates will stream here as they happen."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const time = formatRelativeTime(item.timestamp);
            return (
              <li key={item.id} className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cv-brand" />
                <div className="min-w-0">
                  <p className="line-clamp-2 text-[13px] font-medium text-cv-ink">{item.title}</p>
                  <p className="text-[11px] text-cv-mist">
                    {[item.type, item.status, time].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
