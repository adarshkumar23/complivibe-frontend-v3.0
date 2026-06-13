"use client";

import { History, Activity } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeRisks, riskActivity } from "@/lib/api/risk-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { RisksData } from "@/lib/hooks/useRisks";

export function RecentRiskActivity({ data }: { data: RisksData }) {
  const { risks } = data;
  const list = normalizeRisks(risks.data);
  const events = riskActivity(list).slice(0, 6);

  return (
    <SectionCard title="Recent Risk Activity" subtitle="Latest changes in the register" icon={History} accent="cyan" className="h-full">
      {risks.isLoading ? (
        <SkeletonRows rows={4} />
      ) : risks.isError ? (
        <ErrorState compact title="Unable to load activity" onRetry={() => risks.refetch()} />
      ) : events.length === 0 ? (
        <EmptyState compact icon={Activity} title="No dated risk activity" description="Risk creation and update events appear here when records include timestamps." />
      ) : (
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={`${e.id}-${e.timestamp}`} className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cv-brand" />
              <div className="min-w-0">
                <p className="line-clamp-2 text-[13px] font-medium text-cv-ink">
                  <span className="font-semibold">{e.action}:</span> {e.title}
                </p>
                <p className="text-[11px] text-cv-mist">
                  {[e.status, formatRelativeTime(e.timestamp)].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
