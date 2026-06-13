"use client";

import { useQuery } from "@tanstack/react-query";
import { getQuestionnaires, getQuestionnaireTemplates } from "@/lib/api/questionnaires";
import { getComplianceEvidence } from "@/lib/api/compliance";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn });
}

export function useQuestionnaires() {
  const questionnaires = useEndpoint("questionnaires", getQuestionnaires);
  const templates = useEndpoint("questionnaire-templates", getQuestionnaireTemplates);
  const evidence = useEndpoint("cmp-evidence", getComplianceEvidence);

  return { questionnaires, templates, evidence };
}

export type QuestionnairesData = ReturnType<typeof useQuestionnaires>;
