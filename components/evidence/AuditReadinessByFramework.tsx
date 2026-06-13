"use client";

import { ShieldCheck, LayoutGrid } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { normalizeEvidenceItems, frameworkEvidenceCounts } from "@/lib/api/evidence-normalizers";
import type { EvidenceData } from "@/lib/hooks/useEvidence";

const palette = ["#3B82F6", "#8B5CF6", "#06B6D4", "#14B8A6", "#10B981", "#F59E0B"];

export function AuditReadinessByFramework({ data }: { data: EvidenceData }) {
  const { evidence } = data;
  const items = normalizeEvidenceItems(evidence.data);
  const counts = frameworkEvidenceCounts(items);
  const max = counts.reduce((m, c) => Math.max(m, c.value), 0) || 1;

  return (
    <SectionCard title="Audit Readiness by Framework" subtitle="Evidence mapped per framework" icon={ShieldCheck} accent="purple" className="h-full">
      {evidence.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : evidence.isError ? (
        <ErrorState title="Unable to load evidence" onRetry={() => evidence.refetch()} />
      ) : counts.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No framework mapping"
          description="Once evidence records carry a framework or control field, mapped coverage will appear here."
        />
      ) : (
        <ul className="space-y-4">
          {counts.slice(0, 6).map((c, i) => (
            <li key={c.label}>
              <div className="mb-1.5 flex items-center justify-between text-[13px]">
                <span className="truncate font-semibold text-cv-ink">{c.label}</span>
                <span className="font-bold text-cv-ink">{c.value}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-400/12">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(6, (c.value / max) * 100)}%`, background: palette[i % palette.length] }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
