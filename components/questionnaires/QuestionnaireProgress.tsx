"use client";

import { Percent } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { ScoreRing } from "@/components/charts/ScoreRing";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { normalizeQuestionnaires, isComplete, isInProgress, isPendingReview, averageCompletion } from "@/lib/api/questionnaire-normalizers";
import type { QuestionnairesData } from "@/lib/hooks/useQuestionnaires";

export function QuestionnaireProgress({ data }: { data: QuestionnairesData }) {
  const { questionnaires } = data;
  const list = normalizeQuestionnaires(questionnaires.data);
  const avg = averageCompletion(list);
  const anyStatus = list.some((q) => q.status || q.progress != null);

  return (
    <SectionCard title="Questionnaire Progress" subtitle="Completion across the pipeline" icon={Percent} accent="teal" className="h-full">
      {questionnaires.isLoading ? (
        <LoadingSkeleton className="mx-auto h-36 w-40 rounded-2xl" />
      ) : questionnaires.isError ? (
        <ErrorState compact title="Unable to load progress" onRetry={() => questionnaires.refetch()} />
      ) : !anyStatus ? (
        <EmptyState compact icon={Percent} title="Progress unavailable" description="Completion and status fields have not been returned for any questionnaire." />
      ) : (
        <div className="flex flex-col items-center gap-4">
          <ScoreRing value={avg} size={130} label="Avg complete" />
          <div className="grid w-full grid-cols-3 gap-2.5">
            <div className="rounded-xl bg-white/50 px-2 py-2.5 text-center ring-1 ring-white/60">
              <p className="text-lg font-extrabold text-emerald-600">{list.filter(isComplete).length}</p>
              <p className="text-[10px] font-medium text-cv-slate">Completed</p>
            </div>
            <div className="rounded-xl bg-white/50 px-2 py-2.5 text-center ring-1 ring-white/60">
              <p className="text-lg font-extrabold text-amber-600">{list.filter(isInProgress).length}</p>
              <p className="text-[10px] font-medium text-cv-slate">In progress</p>
            </div>
            <div className="rounded-xl bg-white/50 px-2 py-2.5 text-center ring-1 ring-white/60">
              <p className="text-lg font-extrabold text-violet-600">{list.filter(isPendingReview).length}</p>
              <p className="text-[10px] font-medium text-cv-slate">Pending</p>
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
