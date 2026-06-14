"use client";

import { useQuery } from "@tanstack/react-query";
import { getRegulatoryDeadlines, getRegulatoryIntelligence } from "@/lib/api/regulatory";
import { getFrameworks, getObligations, getComplianceOverview } from "@/lib/api/compliance";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn });
}

export function useRegulatory() {
  const deadlines = useEndpoint("regulatory-deadlines", getRegulatoryDeadlines);
  const intelligence = useEndpoint("regulatory-intelligence", getRegulatoryIntelligence);
  const frameworks = useEndpoint("cmp-frameworks", getFrameworks);
  const obligations = useEndpoint("cmp-obligations", getObligations);
  const overview = useEndpoint("cmp-overview", getComplianceOverview);

  return { deadlines, intelligence, frameworks, obligations, overview };
}

export type RegulatoryData = ReturnType<typeof useRegulatory>;
