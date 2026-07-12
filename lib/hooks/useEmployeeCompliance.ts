"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAttestationCampaign,
  createTrainingRecord,
  getAttestationCampaigns,
  getAttestationDashboard,
  getTrainingRecords,
  getTrainingSummary,
  type AttestationCampaignCreatePayload,
  type TrainingRecordCreatePayload
} from "@/lib/api/employee-compliance";

export function useEmployeeCompliance() {
  const training = useQuery({ queryKey: ["training-summary"], queryFn: getTrainingSummary });
  const records = useQuery({ queryKey: ["training-records"], queryFn: () => getTrainingRecords() });
  const attestations = useQuery({ queryKey: ["attestation-dashboard"], queryFn: getAttestationDashboard });
  const campaigns = useQuery({ queryKey: ["attestation-campaigns"], queryFn: getAttestationCampaigns });

  return { training, records, attestations, campaigns };
}

export type EmployeeComplianceData = ReturnType<typeof useEmployeeCompliance>;

/** POST /api/v1/compliance/attestation-campaigns — campaigns + dashboard refresh without a reload. */
export function useCreateAttestationCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AttestationCampaignCreatePayload) => createAttestationCampaign(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attestation-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["attestation-dashboard"] });
    }
  });
}

/** POST /api/v1/training-analytics/records — records + summary KPIs refresh without a reload. */
export function useCreateTrainingRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TrainingRecordCreatePayload) => createTrainingRecord(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-records"] });
      queryClient.invalidateQueries({ queryKey: ["training-summary"] });
    }
  });
}
