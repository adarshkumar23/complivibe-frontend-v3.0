"use client";

import { useQuery } from "@tanstack/react-query";
import { getAiRiskAssessments, getAiRiskAssessmentsSummary, getIso42001Summary } from "@/lib/api/ai-systems";

export function useAiTesting() {
  const assessments = useQuery({ queryKey: ["ai-risk-assessments"], queryFn: () => getAiRiskAssessments() });
  const summary = useQuery({ queryKey: ["ai-risk-assessments-summary"], queryFn: getAiRiskAssessmentsSummary });
  const iso42001 = useQuery({ queryKey: ["iso42001-summary"], queryFn: getIso42001Summary });

  return { assessments, summary, iso42001 };
}

export type AiTestingData = ReturnType<typeof useAiTesting>;
