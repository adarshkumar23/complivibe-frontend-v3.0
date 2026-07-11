"use client";

import { GitCompareArrows } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { PrivacyData } from "@/lib/hooks/usePrivacy";

/**
 * Cross-framework reconciliation from GET /api/v1/compliance/common-controls/summary:
 * controls satisfying obligations in multiple frameworks (e.g. RBI + DPDP) at once.
 * The backend has no dedicated RBI↔DPDP crosswalk endpoint; this is the real
 * reconciliation surface it does provide.
 */
export function FrameworkReconPanel({ data }: { data: PrivacyData }) {
  const { commonControls } = data;
  const cc = commonControls.data;

  return (
    <SectionCard
      title="Cross-Framework Reconciliation"
      subtitle="Controls counted once, satisfying RBI, DPDP, and other frameworks together"
      icon={GitCompareArrows}
      accent="teal"
      className="h-full"
    >
      {commonControls.isLoading ? (
        <SkeletonRows rows={4} />
      ) : commonControls.isError ? (
        <ErrorState compact title="Unable to load reconciliation" onRetry={() => commonControls.refetch()} />
      ) : !cc || cc.total_common_controls === 0 ? (
        <EmptyState
          compact
          icon={GitCompareArrows}
          title="No shared controls yet"
          description="Map controls to obligations in multiple frameworks to see reuse across RBI, DPDP, and others."
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
            <span className="text-[13px] font-semibold text-cv-ink">Controls shared across frameworks</span>
            <StatusBadge label={`${cc.total_common_controls} controls · ${cc.frameworks_with_common_controls} frameworks`} tone="info" />
          </div>
          <ul className="space-y-2">
            {cc.top_common_controls.map((c) => (
              <li key={c.control_id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
                <p className="min-w-0 truncate text-[13px] font-semibold text-cv-ink">{c.control_name}</p>
                <span className="shrink-0 text-[11px] font-medium text-cv-slate">
                  {c.framework_count} frameworks · {c.obligation_count} obligations
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}
