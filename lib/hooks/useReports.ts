"use client";

import { useQuery } from "@tanstack/react-query";
import { getReports, getReportsSummary, getRegulatoryReportTypes, getBoardScorecards } from "@/lib/api/reports";

export function useReports() {
  const reports = useQuery({ queryKey: ["reports"], queryFn: () => getReports() });
  const summary = useQuery({ queryKey: ["reports-summary"], queryFn: getReportsSummary });
  const regulatoryTypes = useQuery({ queryKey: ["reg-report-types"], queryFn: getRegulatoryReportTypes });
  const scorecards = useQuery({ queryKey: ["board-scorecards"], queryFn: () => getBoardScorecards() });

  return { reports, summary, regulatoryTypes, scorecards };
}

export type ReportsData = ReturnType<typeof useReports>;
