"use client";

import { ClipboardList, CheckCircle2, Loader, ClipboardCheck, Percent, LayoutTemplate } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import {
  normalizeQuestionnaires,
  normalizeQuestionnaireTemplates,
  isComplete,
  isInProgress,
  isPendingReview,
  averageCompletion
} from "@/lib/api/questionnaire-normalizers";
import type { QuestionnairesData } from "@/lib/hooks/useQuestionnaires";

export function QuestionnaireKpis({ data }: { data: QuestionnairesData }) {
  const { questionnaires, templates } = data;
  const list = normalizeQuestionnaires(questionnaires.data);
  const ok = questionnaires.isSuccess;
  const loading = questionnaires.isLoading;

  const total = ok ? list.length : null;
  const anyStatus = list.some((q) => q.status || q.progress != null);
  const completed = ok && anyStatus ? list.filter(isComplete).length : null;
  const inProgress = ok && anyStatus ? list.filter(isInProgress).length : null;
  const pending = ok && anyStatus ? list.filter(isPendingReview).length : null;
  const avg = averageCompletion(list);

  const templateCount = templates.isSuccess ? normalizeQuestionnaireTemplates(templates.data).length : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      <RegistryKpi label="Total Questionnaires" icon={ClipboardList} accent="blue" value={total} caption={total != null ? "in library" : undefined} loading={loading} unavailableHint="Library unavailable" />
      <RegistryKpi label="Completed" icon={CheckCircle2} accent="green" value={completed} caption={completed != null ? "submitted" : undefined} loading={loading} unavailableHint="No status field" />
      <RegistryKpi label="In Progress" icon={Loader} accent="amber" value={inProgress} caption={inProgress != null ? "being answered" : undefined} loading={loading} unavailableHint="No status field" />
      <RegistryKpi label="Pending Review" icon={ClipboardCheck} accent="purple" value={pending} caption={pending != null ? "awaiting review" : undefined} loading={loading} unavailableHint="No status field" />
      <RegistryKpi label="Average Completion" icon={Percent} accent="cyan" value={avg} suffix={avg != null ? "%" : ""} scoreToneFor={avg} caption={avg != null ? "mean progress" : undefined} loading={loading} unavailableHint="No progress data" />
      <RegistryKpi label="Available Templates" icon={LayoutTemplate} accent="teal" value={templateCount} caption={templateCount != null ? "blueprints" : undefined} loading={templates.isLoading} unavailableHint="Templates unavailable" />
    </div>
  );
}
