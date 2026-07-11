"use client";

import { BookOpenCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import type { AiTestingData } from "@/lib/hooks/useAiTesting";

/** ISO/IEC 42001 clause progress from GET /api/v1/ai-governance/iso42001/summary. */
export function ResponsibleAiChecks({ data }: { data: AiTestingData }) {
  const { iso42001 } = data;
  const iso = iso42001.data;
  const sections = iso ? Object.entries(iso.sections) : [];

  return (
    <SectionCard title="ISO/IEC 42001 Clauses" subtitle="AI management system implementation" icon={BookOpenCheck} accent="blue">
      {iso42001.isLoading ? (
        <SkeletonRows rows={5} />
      ) : iso42001.isError ? (
        <ErrorState compact title="Unable to load ISO 42001 tracker" onRetry={() => iso42001.refetch()} />
      ) : sections.length === 0 ? (
        <EmptyState compact icon={BookOpenCheck} title="No clause data" description="ISO 42001 clause tracking will appear here." />
      ) : (
        <ul className="space-y-3">
          {sections.map(([name, sec]) => (
            <li key={name}>
              <div className="mb-1 flex items-center justify-between text-[12px]">
                <span className="font-semibold text-cv-ink">{name}</span>
                <span className="font-medium text-cv-slate">
                  {sec.implemented}/{sec.total}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-400/12">
                <div
                  className="h-full rounded-full bg-cv-brand"
                  style={{ width: `${Math.max(2, sec.pct)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
