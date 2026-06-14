"use client";

import { useQuery } from "@tanstack/react-query";
import { getVendors, getVendorRiskSummary } from "@/lib/api/vendor-risk";
import { getRisks, getComplianceEvidence } from "@/lib/api/compliance";
import { getQuestionnaires } from "@/lib/api/questionnaires";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn });
}

export function useVendorRisk() {
  const vendors = useEndpoint("vendors", getVendors);
  const summary = useEndpoint("vendor-risk-summary", getVendorRiskSummary);
  const risks = useEndpoint("risks", getRisks);
  const evidence = useEndpoint("cmp-evidence", getComplianceEvidence);
  const questionnaires = useEndpoint("questionnaires", getQuestionnaires);

  return { vendors, summary, risks, evidence, questionnaires };
}

export type VendorRiskData = ReturnType<typeof useVendorRisk>;
