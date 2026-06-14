"use client";

import { LayoutGrid } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { insightSeverityTone } from "@/lib/api/insight-normalizers";
import type { ProactiveInsightsData } from "@/lib/hooks/useProactiveInsights";

const buckets = [
  { key: "bad", label: "High", cls: "bg-rose-500/12 text-rose-600 ring-rose-500/20" },
  { key: "warn", label: "Medium", cls: "bg-amber-400/15 text-amber-600 ring-amber-400/25" },
  { key: "good", label: "Low", cls: "bg-emerald-500/12 text-emerald-600 ring-emerald-500/20" },
  { key: "neutral", label: "Unclassified", cls: "bg-slate-400/12 text-slate-500 ring-slate-400/20" }
] as const;

export function PriorityMatrix({ data }: { data: ProactiveInsightsData }) {
  const { insights, isLoading, allUnavailable } = data;

  const counts: Record<string, number> = { bad: 0, warn: 0, good: 0, neutral: 0 };
  for (const i of insights) counts[insightSeverityTone(i.severity)] += 1;

  return (
    <SectionCard title="Priority Matrix" subtitle="Insights by real severity/priority" icon={LayoutGrid} accent="teal" className="h-full">
      {isLoading && insights.length === 0 ? (
        <SkeletonRows rows={3} />
      ) : allUnavailable || insights.length === 0 ? (
        <EmptyState icon={LayoutGrid} title="No priority data" description="Insight priority will appear here once insights are available." />
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {buckets.map((b) => (
            <div key={b.key} className={`rounded-2xl px-3 py-4 text-center ring-1 ${b.cls}`}>
              <p className="text-[26px] font-extrabold leading-none">{counts[b.key]}</p>
              <p className="mt-1 text-[11px] font-semibold">{b.label}</p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
