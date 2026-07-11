"use client";

import { useQuery } from "@tanstack/react-query";
import { getPostureSummary, getDeadlines, getDashboardSummary, getBoardScorecards, getRisks } from "@/lib/api/executive";

export function useExecutiveSummary() {
  const posture = useQuery({ queryKey: ["cmp-posture"], queryFn: getPostureSummary });
  const summary = useQuery({ queryKey: ["dashboard-summary"], queryFn: getDashboardSummary });
  const scorecards = useQuery({ queryKey: ["board-scorecards"], queryFn: () => getBoardScorecards() });
  const risks = useQuery({ queryKey: ["risks"], queryFn: () => getRisks() });
  const deadlines = useQuery({ queryKey: ["cmp-deadlines"], queryFn: () => getDeadlines() });

  return { posture, summary, scorecards, risks, deadlines };
}

export type ExecutiveData = ReturnType<typeof useExecutiveSummary>;
