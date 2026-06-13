"use client";

import { LayoutTemplate } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeQuestionnaireTemplates } from "@/lib/api/questionnaire-normalizers";
import type { QuestionnairesData } from "@/lib/hooks/useQuestionnaires";

export function QuestionnaireTemplates({ data }: { data: QuestionnairesData }) {
  const { templates } = data;
  const list = normalizeQuestionnaireTemplates(templates.data);

  return (
    <SectionCard title="Templates" subtitle="Reusable questionnaire blueprints" icon={LayoutTemplate} accent="cyan" className="h-full">
      {templates.isLoading ? (
        <SkeletonRows rows={4} />
      ) : templates.isError ? (
        <ErrorState title="Unable to load templates" onRetry={() => templates.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon={LayoutTemplate} title="No templates available" description="Questionnaire templates will appear here once the backend returns them." />
      ) : (
        <ul className="max-h-[340px] space-y-2.5 overflow-y-auto pr-1">
          {list.slice(0, 8).map((t) => (
            <li key={t.id} className="rounded-2xl bg-white/55 p-3.5 ring-1 ring-white/70">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-semibold leading-snug text-cv-ink">{t.name}</p>
                {t.questionCount != null ? <span className="shrink-0 rounded-full bg-cv-brand-soft px-2 py-0.5 text-[10px] font-semibold text-cv-blue ring-1 ring-white/60">{t.questionCount} Q</span> : null}
              </div>
              {t.type || t.framework ? <p className="mt-0.5 text-[11px] font-medium text-cv-slate">{[t.type, t.framework].filter(Boolean).join(" · ")}</p> : null}
              {t.description ? <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-cv-slate">{t.description}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
