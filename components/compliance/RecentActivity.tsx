"use client";

import { History, Activity } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { formatRelativeTime } from "@/lib/utils/format";
import type { Compliance } from "@/lib/hooks/useCompliance";

/** "control.obligation_mapped" → "Control obligation mapped" */
function humanizeAction(action: string): string {
  const text = action.replaceAll(".", " ").replaceAll("_", " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function RecentActivity({ data }: { data: Compliance }) {
  const { activity } = data;
  const items = (activity.data ?? []).slice(0, 6);

  return (
    <SectionCard
      title="Recent Compliance Activity"
      subtitle="Latest audited changes from the activity log"
      icon={History}
      accent="cyan"
    >
      {activity.isLoading ? (
        <SkeletonRows rows={4} />
      ) : activity.isError ? (
        <ErrorState compact title="Unable to load activity" onRetry={() => activity.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          compact
          icon={Activity}
          title="No recent activity"
          description="Audited compliance changes will stream here as they happen."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cv-brand" />
              <div className="min-w-0">
                <p className="line-clamp-2 text-[13px] font-medium text-cv-ink">{humanizeAction(item.action)}</p>
                <p className="text-[11px] text-cv-mist">
                  {[item.entity_type.replaceAll("_", " "), formatRelativeTime(item.created_at)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
