"use client";

import { FileCheck2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { evidenceCoverage } from "@/lib/api/score-explainer-normalizers";
import type { ScoreExplainerData } from "@/lib/hooks/useScoreExplainer";

const palette = ["#3B82F6", "#8B5CF6", "#06B6D4", "#14B8A6", "#10B981", "#F59E0B", "#EF4444"];

export function EvidenceCoverageSection({ data }: { data: ScoreExplainerData }) {
  const { evidence } = data;
  const cov = evidenceCoverage(evidence.data);
  const max = cov.byFramework.reduce((m, b) => Math.max(m, b.value), 0) || 1;

  return (
    <SectionCard title="Evidence Coverage" subtitle="Real evidence mapped by framework" icon={FileCheck2} accent="green" className="h-full">
      {evidence.isLoading ? (
        <SkeletonRows rows={4} />
      ) : evidence.isError ? (
        <EmptyState icon={FileCheck2} title="Evidence coverage unavailable" description="The evidence endpoint is not available on this backend yet." />
      ) : cov.total === 0 ? (
        <EmptyState icon={FileCheck2} title="No evidence records" description="Evidence coverage will appear here once the vault returns records." />
      ) : cov.byFramework.length === 0 ? (
        <EmptyState icon={FileCheck2} title="No framework mapping" description={`${cov.total} evidence items returned, but none include framework mapping fields.`} />
      ) : (
        <div className="space-y-3.5">
          <p className="text-[12px] font-medium text-cv-slate">{cov.total} evidence items across {cov.byFramework.length} frameworks</p>
          <ul className="space-y-3">
            {cov.byFramework.slice(0, 8).map((b, i) => (
              <li key={b.label}>
                <div className="mb-1.5 flex items-center justify-between text-[13px]">
                  <span className="truncate font-semibold text-cv-ink">{b.label}</span>
                  <span className="font-bold text-cv-ink">{b.value}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-400/12">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(6, (b.value / max) * 100)}%`, background: palette[i % palette.length] }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}
