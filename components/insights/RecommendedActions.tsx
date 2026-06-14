"use client";

import { useMemo } from "react";
import { ListChecks } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import type { ProactiveInsightsData } from "@/lib/hooks/useProactiveInsights";

export function RecommendedActions({ data }: { data: ProactiveInsightsData }) {
  const { insights, isLoading, allUnavailable } = data;

  // Aggregate the factual next-step recommendations actually present on insights.
  const actions = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of insights) if (i.recommendation) m.set(i.recommendation, (m.get(i.recommendation) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [insights]);

  return (
    <SectionCard title="Recommended Actions" subtitle="Factual next steps from insights" icon={ListChecks} accent="amber" className="h-full">
      {isLoading && insights.length === 0 ? (
        <SkeletonRows rows={4} />
      ) : allUnavailable || actions.length === 0 ? (
        <EmptyState icon={ListChecks} title="No recommended actions" description="Suggested next steps will appear here once insights are available." />
      ) : (
        <ul className="space-y-2">
          {actions.map(([label, count]) => (
            <li key={label} className="flex items-center justify-between gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
              <span className="text-[13px] font-semibold text-cv-ink">{label}</span>
              <span className="rounded-full bg-cv-brand-soft px-2 py-0.5 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">{count}</span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
