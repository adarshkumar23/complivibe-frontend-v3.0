"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getTrainingSummary,
  getTrainingRecords,
  getAttestationDashboard,
  getAttestationCampaigns
} from "@/lib/api/employee-compliance";

export function useEmployeeCompliance() {
  const training = useQuery({ queryKey: ["training-summary"], queryFn: getTrainingSummary });
  const records = useQuery({ queryKey: ["training-records"], queryFn: () => getTrainingRecords() });
  const attestations = useQuery({ queryKey: ["attestation-dashboard"], queryFn: getAttestationDashboard });
  const campaigns = useQuery({ queryKey: ["attestation-campaigns"], queryFn: getAttestationCampaigns });

  return { training, records, attestations, campaigns };
}

export type EmployeeComplianceData = ReturnType<typeof useEmployeeCompliance>;
