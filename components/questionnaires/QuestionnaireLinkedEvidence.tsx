"use client";

import { FileCheck2, FolderOpen } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeEvidenceItems } from "@/lib/api/evidence-normalizers";
import type { QuestionnairesData } from "@/lib/hooks/useQuestionnaires";

export function QuestionnaireLinkedEvidence({ data }: { data: QuestionnairesData }) {
  const { evidence } = data;
  const items = normalizeEvidenceItems(evidence.data);

  return (
    <SectionCard title="Linked Evidence" subtitle="Evidence available to attach" icon={FileCheck2} accent="green" className="h-full">
      {evidence.isLoading ? (
        <SkeletonRows rows={4} />
      ) : evidence.isError ? (
        <ErrorState compact title="Unable to load evidence" onRetry={() => evidence.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState compact icon={FolderOpen} title="No evidence to link" description="Evidence records that can back questionnaire answers will appear here." />
      ) : (
        <ul className="max-h-[320px] space-y-2.5 overflow-y-auto pr-1">
          {items.slice(0, 8).map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{e.title}</p>
                {e.type ? <p className="truncate text-[11px] text-cv-slate">{e.type}</p> : null}
              </div>
              {e.status ? <StatusBadge label={e.status} tone="info" /> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
