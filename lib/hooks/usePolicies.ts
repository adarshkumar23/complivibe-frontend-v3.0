"use client";

import { useQuery } from "@tanstack/react-query";
import { getPolicies, getPolicyTemplates } from "@/lib/api/policies";
import { getFrameworks, getObligations, getComplianceOverview, getComplianceEvidence } from "@/lib/api/compliance";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn });
}

export function usePolicies() {
  const policies = useEndpoint("policies", getPolicies);
  const templates = useEndpoint("policy-templates", getPolicyTemplates);
  const frameworks = useEndpoint("cmp-frameworks", getFrameworks);
  const obligations = useEndpoint("cmp-obligations", getObligations);
  const overview = useEndpoint("cmp-overview", getComplianceOverview);
  const evidence = useEndpoint("cmp-evidence", getComplianceEvidence);

  return { policies, templates, frameworks, obligations, overview, evidence };
}

export type PoliciesData = ReturnType<typeof usePolicies>;
