"use client";

import { LayoutGrid } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { normalizeFrameworks } from "@/lib/api/compliance-normalizers";
import { normalizeEvidenceItems, frameworkEvidenceCounts } from "@/lib/api/evidence-normalizers";
import { scoreTone } from "@/lib/utils/format";
import type { AuditPackData } from "@/lib/hooks/useAuditPack";

const toneColor = { good: "#10B981", warn: "#F59E0B", bad: "#EF4444" } as const;
const palette = ["#3B82F6", "#8B5CF6", "#06B6D4", "#14B8A6", "#10B981", "#F59E0B"];

export function ControlCoverage({ data }: { data: AuditPackData }) {
  const { frameworks, evidence } = data;
  const fws = normalizeFrameworks(frameworks.data);
  const withCoverage = fws.filter((f) => f.coverage != null);
  const evCounts = frameworkEvidenceCounts(normalizeEvidenceItems(evidence.data));
  const evMax = evCounts.reduce((m, c) => Math.max(m, c.value), 0) || 1;

  const loading = frameworks.isLoading && evidence.isLoading;
  const errored = frameworks.isError && evidence.isError;

  return (
    <SectionCard title="Control / Framework Coverage" subtitle="Mapped controls per framework" icon={LayoutGrid} accent="purple" className="h-full">
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : errored ? (
        <ErrorState title="Unable to load coverage" onRetry={() => frameworks.refetch()} />
      ) : withCoverage.length > 0 ? (
        <ul className="space-y-4">
          {withCoverage.slice(0, 6).map((f) => {
            const tone = scoreTone(f.coverage);
            return (
              <li key={f.id}>
                <div className="mb-1.5 flex items-center justify-between text-[13px]">
                  <span className="truncate font-semibold text-cv-ink">{f.name}</span>
                  <span className="font-bold text-cv-ink">{Math.round(f.coverage!)}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-400/12">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(4, Math.min(100, f.coverage!))}%`, background: toneColor[tone] }} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : evCounts.length > 0 ? (
        <ul className="space-y-4">
          {evCounts.slice(0, 6).map((c, i) => (
            <li key={c.label}>
              <div className="mb-1.5 flex items-center justify-between text-[13px]">
                <span className="truncate font-semibold text-cv-ink">{c.label}</span>
                <span className="font-bold text-cv-ink">{c.value} evidence</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-400/12">
                <div className="h-full rounded-full" style={{ width: `${Math.max(6, (c.value / evMax) * 100)}%`, background: palette[i % palette.length] }} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={LayoutGrid}
          title="Control coverage unavailable"
          description="Backend has not returned framework/control mapping yet."
        />
      )}
    </SectionCard>
  );
}
