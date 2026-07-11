"use client";

import { useQuery } from "@tanstack/react-query";
import { getPolicies, getPolicySummary, getPolicyTemplates } from "@/lib/api/policies";

export function usePolicies() {
  const policies = useQuery({ queryKey: ["policies"], queryFn: getPolicies });
  const summary = useQuery({ queryKey: ["policy-summary"], queryFn: getPolicySummary });
  const templates = useQuery({ queryKey: ["policy-templates"], queryFn: () => getPolicyTemplates(20) });

  return { policies, summary, templates };
}

export type PoliciesData = ReturnType<typeof usePolicies>;
