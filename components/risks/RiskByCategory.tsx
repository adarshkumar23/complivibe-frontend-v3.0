"use client";

import { PieChart, Layers } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { normalizeRisks, riskCategoryCounts } from "@/lib/api/risk-normalizers";
import type { RisksData } from "@/lib/hooks/useRisks";

const palette = ["#3B82F6", "#8B5CF6", "#06B6D4", "#14B8A6", "#10B981", "#F59E0B", "#EF4444"];

export function RiskByCategory({ data }: { data: RisksData }) {
  const { risks } = data;
  const list = normalizeRisks(risks.data);
  const counts = riskCategoryCounts(list);
  const max = counts.reduce((m, c) => Math.max(m, c.value), 0) || 1;

  return (
    <SectionCard title="Risk by Category" subtitle="Distribution across domains" icon={PieChart} accent="purple">
      {risks.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : risks.isError ? (
        <ErrorState compact title="Unable to load risks" onRetry={() => risks.refetch()} />
      ) : counts.length === 0 ? (
        <EmptyState compact icon={Layers} title="No risk categories" description="Category distribution appears here once risks are registered." />
      ) : (
        <ul className="space-y-4">
          {counts.slice(0, 6).map((c, i) => (
            <li key={c.label}>
              <div className="mb-1.5 flex items-center justify-between text-[13px]">
                <span className="truncate font-semibold capitalize text-cv-ink">{c.label}</span>
                <span className="font-bold text-cv-ink">{c.value}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-400/12">
                <div className="h-full rounded-full" style={{ width: `${Math.max(6, (c.value / max) * 100)}%`, background: palette[i % palette.length] }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
