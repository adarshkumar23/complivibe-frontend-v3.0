"use client";

import { useQuery } from "@tanstack/react-query";
import { getAutomationSummary, getAutomationRules, getAutomationExecutions } from "@/lib/api/automation";

export function useAutomation() {
  const summary = useQuery({ queryKey: ["automation-summary"], queryFn: getAutomationSummary });
  const rules = useQuery({ queryKey: ["automation-rules"], queryFn: getAutomationRules });
  const executions = useQuery({ queryKey: ["automation-executions"], queryFn: () => getAutomationExecutions(20) });

  return { summary, rules, executions };
}

export type AutomationData = ReturnType<typeof useAutomation>;
