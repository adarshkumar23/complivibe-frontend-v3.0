"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getTeam, getPolicies, getEvidenceList,
  getEmployeeComplianceSummary, getTraining, getAttestations, getPolicyAcknowledgements
} from "@/lib/api/employee-compliance";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn, retry: false });
}

export function useEmployeeCompliance() {
  const team = useEndpoint("emp-team", getTeam);
  const summary = useEndpoint("emp-summary", getEmployeeComplianceSummary);
  const acknowledgements = useEndpoint("emp-acks", getPolicyAcknowledgements);
  const training = useEndpoint("emp-training", getTraining);
  const attestations = useEndpoint("emp-attestations", getAttestations);
  const policies = useEndpoint("emp-policies", getPolicies);
  const evidence = useEndpoint("emp-evidence", getEvidenceList);

  return { team, summary, acknowledgements, training, attestations, policies, evidence };
}

export type EmployeeComplianceData = ReturnType<typeof useEmployeeCompliance>;
