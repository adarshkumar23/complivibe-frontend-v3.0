"use client";

import { History, GitBranch } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeLifecycleHistory } from "@/lib/api/ai-system-detail-normalizers";
import { formatRelativeTime, formatDate } from "@/lib/utils/format";
import type { AiSystemDetail } from "@/lib/hooks/useAiSystemDetail";

export function LifecycleHistory({ data }: { data: AiSystemDetail }) {
  const { lifecycle } = data;
  const events = normalizeLifecycleHistory(lifecycle.data);

  return (
    <SectionCard title="Lifecycle History" subtitle="Timeline of governance events" icon={History} accent="purple" className="h-full">
      {lifecycle.isLoading ? (
        <SkeletonRows rows={4} />
      ) : lifecycle.isError ? (
        <ErrorState title="Unable to load lifecycle history" onRetry={() => lifecycle.refetch()} />
      ) : events.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="No lifecycle events"
          description="Registration, assessments, and stage changes will appear here as a timeline."
        />
      ) : (
        <ol className="relative space-y-4 border-l border-white/60 pl-5">
          {events.slice(0, 8).map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -left-[26px] top-1 h-3 w-3 rounded-full bg-cv-brand ring-4 ring-white/70" />
              <p className="text-[13px] font-semibold text-cv-ink">{e.title}</p>
              <p className="text-[11px] text-cv-mist">
                {[e.stage, formatRelativeTime(e.timestamp) || formatDate(e.timestamp)].filter(Boolean).join(" · ") || "—"}
              </p>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  );
}
