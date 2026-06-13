"use client";

import { LayoutGrid } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { normalizeFrameworks } from "@/lib/api/compliance-normalizers";
import { scoreTone } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Compliance } from "@/lib/hooks/useCompliance";

const tones = ["#3B82F6", "#8B5CF6", "#06B6D4", "#14B8A6", "#10B981", "#F59E0B"];

export function FrameworkReadiness({ data }: { data: Compliance }) {
  const { frameworks } = data;
  const items = normalizeFrameworks(frameworks.data);

  return (
    <SectionCard
      title="Framework Readiness"
      subtitle="Control coverage across active frameworks"
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
      {frameworks.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : frameworks.isError ? (
        <ErrorState title="Unable to load frameworks" onRetry={() => frameworks.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No frameworks configured"
          description="Add a regulatory framework to start tracking control coverage and readiness."
        />
      ) : (
        <ul className="space-y-4">
          {items.slice(0, 6).map((fw, i) => {
            const has = fw.coverage != null;
            const tone = scoreTone(fw.coverage);
            return (
              <li key={fw.id}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-[13px] font-bold text-cv-ink">{fw.name}</span>
                    {fw.controlsTotal != null ? (
                      <span className="shrink-0 text-[11px] font-medium text-cv-mist">
                        {fw.controlsMet ?? 0}/{fw.controlsTotal} controls
                      </span>
                    ) : null}
                  </div>
                  {has ? (
                    <StatusBadge
                      label={`${Math.round(fw.coverage!)}%`}
                      tone={tone === "good" ? "good" : tone === "warn" ? "warn" : "bad"}
                    />
                  ) : fw.status ? (
                    <StatusBadge label={fw.status} tone="info" />
                  ) : (
                    <StatusBadge label="No data" tone="neutral" />
                  )}
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-400/12">
                  {has ? (
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(4, Math.min(100, fw.coverage!))}%`,
                        background: tones[i % tones.length]
                      }}
                    />
                  ) : (
                    <div
                      className={cn(
                        "h-full w-full",
                        "bg-[repeating-linear-gradient(90deg,rgba(148,163,184,0.25)_0_8px,transparent_8px_16px)]"
                      )}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
