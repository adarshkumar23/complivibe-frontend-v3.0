"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getPostureSummary,
  getFrameworkReadiness,
  getControlHealth,
  getRecentActivity,
  getDeadlines,
  getDeadlineSummary,
  getIssues,
  getIssueDashboard
} from "@/lib/api/compliance";

export function useCompliance() {
  const posture = useQuery({ queryKey: ["cmp-posture"], queryFn: getPostureSummary });
  const readiness = useQuery({ queryKey: ["cmp-readiness"], queryFn: getFrameworkReadiness });
  const controlHealth = useQuery({ queryKey: ["cmp-control-health"], queryFn: getControlHealth });
  const activity = useQuery({ queryKey: ["cmp-activity"], queryFn: () => getRecentActivity(12) });
  const deadlines = useQuery({ queryKey: ["cmp-deadlines"], queryFn: () => getDeadlines() });
  const deadlineSummary = useQuery({ queryKey: ["cmp-deadline-summary"], queryFn: getDeadlineSummary });
  const issues = useQuery({ queryKey: ["cmp-issues"], queryFn: () => getIssues() });
  const issueDashboard = useQuery({ queryKey: ["cmp-issue-dashboard"], queryFn: getIssueDashboard });

  return { posture, readiness, controlHealth, activity, deadlines, deadlineSummary, issues, issueDashboard };
}

export type Compliance = ReturnType<typeof useCompliance>;
