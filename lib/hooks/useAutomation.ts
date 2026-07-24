"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAutomationSummary,
  getAutomationRules,
  getAutomationExecutions,
  createAutomationRule,
  updateAutomationRule,
  type AutomationRuleInput
} from "@/lib/api/automation";

export function useAutomation() {
  const summary = useQuery({ queryKey: ["automation-summary"], queryFn: getAutomationSummary });
  const rules = useQuery({ queryKey: ["automation-rules"], queryFn: getAutomationRules });
  const executions = useQuery({ queryKey: ["automation-executions"], queryFn: () => getAutomationExecutions(20) });

  return { summary, rules, executions };
}

export type AutomationData = ReturnType<typeof useAutomation>;

function useInvalidateAutomation() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["automation-rules"] });
    qc.invalidateQueries({ queryKey: ["automation-summary"] });
  };
}

export function useCreateAutomationRule() {
  const invalidate = useInvalidateAutomation();
  return useMutation({ mutationFn: (body: AutomationRuleInput) => createAutomationRule(body), onSuccess: invalidate });
}
export function useUpdateAutomationRule() {
  const invalidate = useInvalidateAutomation();
  return useMutation({
    mutationFn: ({ ruleId, body }: { ruleId: string; body: Partial<AutomationRuleInput> }) => updateAutomationRule(ruleId, body),
    onSuccess: invalidate
  });
}
