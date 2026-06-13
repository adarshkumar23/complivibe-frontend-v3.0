"use client";

import { History, Activity } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeQuestionnaires, questionnaireActivity } from "@/lib/api/questionnaire-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { QuestionnairesData } from "@/lib/hooks/useQuestionnaires";

export function RecentQuestionnaireActivity({ data }: { data: QuestionnairesData }) {
  const { questionnaires } = data;
  const list = normalizeQuestionnaires(questionnaires.data);
  const events = questionnaireActivity(list).slice(0, 6);

  return (
    <SectionCard title="Recent Questionnaire Activity" subtitle="Latest uploads & submissions" icon={History} accent="cyan" className="h-full">
      {questionnaires.isLoading ? (
        <SkeletonRows rows={4} />
      ) : questionnaires.isError ? (
        <ErrorState compact title="Unable to load activity" onRetry={() => questionnaires.refetch()} />
      ) : events.length === 0 ? (
        <EmptyState compact icon={Activity} title="No dated questionnaire activity" description="Upload and submission events appear here when records include timestamps." />
      ) : (
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={`${e.id}-${e.timestamp}`} className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cv-brand" />
              <div className="min-w-0">
                <p className="line-clamp-2 text-[13px] font-medium text-cv-ink">
                  <span className="font-semibold">{e.action}:</span> {e.title}
                </p>
                <p className="text-[11px] text-cv-mist">{[e.status, formatRelativeTime(e.timestamp)].filter(Boolean).join(" · ") || "—"}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
