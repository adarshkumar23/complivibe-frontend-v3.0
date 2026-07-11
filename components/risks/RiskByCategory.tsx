"use client";

import { ChartBarBig } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import type { RisksData } from "@/lib/hooks/useRisks";

const barColors = ["#3B82F6", "#8B5CF6", "#14B8A6", "#F59E0B", "#EF4444", "#06B6D4"];

/** Category distribution aggregated from the real risk register. */
export function RiskByCategory({ data }: { data: RisksData }) {
  const { risks } = data;
  const list = risks.data ?? [];

  const byCategory = new Map<string, { count: number; maxScore: number }>();
  for (const r of list) {
    const key = r.category ?? "uncategorized";
    const entry = byCategory.get(key) ?? { count: 0, maxScore: 0 };
    entry.count += 1;
    entry.maxScore = Math.max(entry.maxScore, r.inherent_score ?? 0);
    byCategory.set(key, entry);
  }
  const entries = [...byCategory.entries()].sort((a, b) => b[1].count - a[1].count);
  const total = list.length;

  return (
    <SectionCard title="Risks by Category" subtitle="Where exposure concentrates" icon={ChartBarBig} accent="purple">
      {risks.isLoading ? (
        <SkeletonRows rows={4} />
      ) : risks.isError ? (
        <ErrorState compact title="Unable to load risks" onRetry={() => risks.refetch()} />
      ) : entries.length === 0 ? (
        <EmptyState compact icon={ChartBarBig} title="No risks yet" description="Category distribution will appear here." />
      ) : (
        <ul className="space-y-3">
          {entries.map(([cat, { count, maxScore }], i) => (
            <li key={cat}>
              <div className="mb-1 flex items-center justify-between text-[12px]">
                <span className="font-semibold text-cv-ink">{cat.replaceAll("_", " ")}</span>
                <span className="font-medium text-cv-slate">
                  {count} · peak score {maxScore}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-400/12">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(6, (count / total) * 100)}%`, background: barColors[i % barColors.length] }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
