"use client";

import { Layers } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { cn } from "@/lib/utils/cn";
import type { RegulatoryData } from "@/lib/hooks/useRegulatory";

/** Active frameworks from GET /api/v1/frameworks/active, selectable to drive the obligations table. */
export function FrameworkCoverage({ data }: { data: RegulatoryData }) {
  const { active, frameworkId, setSelectedFrameworkId } = data;
  const items = active.data ?? [];

  return (
    <SectionCard
      title="Active Frameworks"
      subtitle="Select a framework to browse its obligations"
      icon={Layers}
      accent="purple"
      className="h-full"
    >
      {active.isLoading ? (
        <SkeletonRows rows={5} />
      ) : active.isError ? (
        <ErrorState compact title="Unable to load active frameworks" onRetry={() => active.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          compact
          icon={Layers}
          title="No frameworks activated"
          description="Activate frameworks from the catalog to scope your obligations."
        />
      ) : (
        <ul className="space-y-2">
          {items.map((af) => {
            const selected = af.framework_id === frameworkId;
            return (
              <li key={af.id}>
                <button
                  type="button"
                  onClick={() => setSelectedFrameworkId(af.framework_id)}
                  className={cn(
                    "cv-ring-focus w-full rounded-2xl px-3.5 py-3 text-left ring-1 transition",
                    selected ? "bg-cv-brand-soft ring-cv-blue/30" : "bg-white/50 ring-white/60 hover:bg-white/80"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold text-cv-ink">{af.framework.name}</p>
                      <p className="text-[11px] text-cv-slate">
                        {[af.framework.jurisdiction, af.framework.authority].filter(Boolean).join(" · ") ||
                          af.framework.code}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {af.activation_outdated ? <StatusBadge label="Content updated" tone="warn" /> : null}
                      <StatusBadge
                        label={`${af.active_obligation_count ?? af.total_obligation_count ?? 0} obligations`}
                        tone={selected ? "info" : "neutral"}
                      />
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
