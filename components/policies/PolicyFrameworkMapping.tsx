"use client";

import { PieChart } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import type { PoliciesData } from "@/lib/hooks/usePolicies";

const barColors = ["#3B82F6", "#8B5CF6", "#14B8A6", "#10B981", "#F59E0B", "#06B6D4", "#EF4444"];

/** Policy-type mix from GET /api/v1/compliance/policies/summary (by_policy_type). */
export function PolicyFrameworkMapping({ data }: { data: PoliciesData }) {
  const { summary } = data;
  const byType = summary.data?.by_policy_type ?? {};
  const entries = Object.entries(byType).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, n]) => s + n, 0);

  return (
    <SectionCard title="Policy Mix" subtitle="Coverage by policy domain" icon={PieChart} accent="teal">
      {summary.isLoading ? (
        <SkeletonRows rows={4} />
      ) : summary.isError ? (
        <ErrorState compact title="Unable to load policy mix" onRetry={() => summary.refetch()} />
      ) : entries.length === 0 ? (
        <EmptyState compact icon={PieChart} title="No policies yet" description="Policy domain coverage will appear here." />
      ) : (
        <ul className="space-y-3">
          {entries.map(([type, count], i) => (
            <li key={type}>
              <div className="mb-1 flex items-center justify-between text-[12px]">
                <span className="font-semibold text-cv-ink">{type.replaceAll("_", " ")}</span>
                <span className="font-medium text-cv-slate">{count}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-400/12">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${total > 0 ? Math.max(4, (count / total) * 100) : 0}%`,
                    background: barColors[i % barColors.length]
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
