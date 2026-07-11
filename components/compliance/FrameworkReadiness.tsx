"use client";

import { LayoutGrid } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { scoreTone } from "@/lib/utils/format";
import type { Compliance } from "@/lib/hooks/useCompliance";

const tones = ["#3B82F6", "#8B5CF6", "#06B6D4", "#14B8A6", "#10B981", "#F59E0B"];

export function FrameworkReadiness({ data }: { data: Compliance }) {
  const { readiness } = data;
  const items = readiness.data ?? [];

  return (
    <SectionCard
      title="Framework Readiness"
      subtitle="Control coverage and open gaps per active framework"
      icon={LayoutGrid}
      accent="purple"
      className="h-full"
      action={
        items.length > 0 ? (
          <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
            {items.length} frameworks
          </span>
        ) : null
      }
    >
      {readiness.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : readiness.isError ? (
        <ErrorState title="Unable to load framework readiness" onRetry={() => readiness.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No frameworks activated"
          description="Activate a regulatory framework to start tracking control coverage and readiness."
        />
      ) : (
        <ul className="space-y-4">
          {items.map((fw, i) => {
            const tone = scoreTone(fw.control_coverage_pct);
            return (
              <li key={fw.framework_id}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-[13px] font-bold text-cv-ink">{fw.name}</span>
                    <span className="shrink-0 text-[11px] font-medium text-cv-mist">
                      {fw.mapped_control_count} controls · {fw.obligation_count} obligations
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {fw.open_gaps_count > 0 ? (
                      <StatusBadge label={`${fw.open_gaps_count} gaps`} tone="warn" />
                    ) : null}
                    <StatusBadge
                      label={`${Math.round(fw.control_coverage_pct)}%`}
                      tone={tone === "good" ? "good" : tone === "warn" ? "warn" : "bad"}
                    />
                  </div>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-400/12">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(2, Math.min(100, fw.control_coverage_pct))}%`,
                      background: tones[i % tones.length]
                    }}
                  />
                </div>
                {fw.readiness_insight ? (
                  <p className="mt-1 text-[11px] leading-snug text-cv-slate">{fw.readiness_insight}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
