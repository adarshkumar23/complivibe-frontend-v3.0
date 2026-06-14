"use client";

import { Network } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { insightSourceMap } from "@/lib/api/insight-normalizers";
import type { ProactiveInsightsData } from "@/lib/hooks/useProactiveInsights";

export function InsightSourceMap({ data }: { data: ProactiveInsightsData }) {
  const { insights, isLoading, allUnavailable } = data;
  const map = insightSourceMap(insights);
  const max = map.reduce((m, x) => Math.max(m, x.count), 0) || 1;

  return (
    <SectionCard title="Insight Sources" subtitle="Modules contributing insights" icon={Network} accent="purple" className="h-full">
      {isLoading && insights.length === 0 ? (
        <SkeletonRows rows={5} />
      ) : allUnavailable || map.length === 0 ? (
        <EmptyState icon={Network} title="No insight sources" description="Contributing modules will appear here once insights are available." />
      ) : (
        <ul className="space-y-3">
          {map.map((m) => (
            <li key={m.key}>
              <div className="mb-1 flex items-center justify-between text-[13px]">
                <span className="font-semibold text-cv-ink">{m.label}</span>
                <span className="font-bold text-cv-ink">{m.count}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-400/12">
                <div className="h-full rounded-full bg-cv-brand" style={{ width: `${Math.max(6, (m.count / max) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
