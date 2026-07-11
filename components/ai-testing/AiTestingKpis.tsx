"use client";

import { ClipboardCheck, FileEdit, CheckCircle2, BookOpenCheck } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import type { AiTestingData } from "@/lib/hooks/useAiTesting";

export function AiTestingKpis({ data }: { data: AiTestingData }) {
  const { summary, iso42001 } = data;
  const s = summary.data;
  const iso = iso42001.data;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi
        label="Risk Assessments"
        icon={ClipboardCheck}
        accent="purple"
        value={s ? s.total_assessments : null}
        caption={s && s.latest_completed_at == null ? "none completed yet" : undefined}
        loading={summary.isLoading}
        unavailableHint="Assessment summary unavailable"
      />
      <RegistryKpi
        label="Drafts / In Review"
        icon={FileEdit}
        accent="amber"
        value={s ? s.draft_assessments + s.in_review_assessments : null}
        caption={s ? `${s.draft_assessments} draft · ${s.in_review_assessments} in review` : undefined}
        loading={summary.isLoading}
        unavailableHint="Assessment summary unavailable"
      />
      <RegistryKpi
        label="Completed"
        icon={CheckCircle2}
        accent="green"
        value={s ? s.completed_assessments : null}
        caption={s && s.completed_assessments === 0 ? "complete assessments to establish risk levels" : undefined}
        loading={summary.isLoading}
        unavailableHint="Assessment summary unavailable"
      />
      <RegistryKpi
        label="ISO 42001 Progress"
        icon={BookOpenCheck}
        accent="blue"
        value={iso ? Math.round(iso.implementation_pct) : null}
        caption={iso ? `${iso.by_status["implemented"] ?? 0} of ${iso.total_clauses} clauses implemented` : undefined}
        loading={iso42001.isLoading}
        unavailableHint="ISO 42001 tracker unavailable"
      />
    </div>
  );
}
