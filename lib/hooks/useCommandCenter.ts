"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary, getComplianceTimeline } from "@/lib/api/command";
import { getPostureSummary, getIssueDashboard, getDeadlines } from "@/lib/api/compliance";

export function useCommandCenter() {
  const summary = useQuery({ queryKey: ["dashboard-summary"], queryFn: getDashboardSummary });
  const posture = useQuery({ queryKey: ["cmp-posture"], queryFn: getPostureSummary });
  const issues = useQuery({ queryKey: ["cmp-issue-dashboard"], queryFn: getIssueDashboard });
  const timeline = useQuery({ queryKey: ["compliance-timeline"], queryFn: getComplianceTimeline });
  const deadlines = useQuery({ queryKey: ["cmp-deadlines"], queryFn: () => getDeadlines() });

  return { summary, posture, issues, timeline, deadlines };
}

export type CommandCenterData = ReturnType<typeof useCommandCenter>;
