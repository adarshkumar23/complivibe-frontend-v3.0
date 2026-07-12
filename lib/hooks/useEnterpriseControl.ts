"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAccessCertCampaign,
  createBusinessUnit,
  getAccessCertCampaigns,
  getBusinessUnits,
  getRecertificationSummary,
  type AccessCertCampaignCreatePayload,
  type BusinessUnitCreatePayload
} from "@/lib/api/enterprise";
import { getSodFindings } from "@/lib/api/security";

export function useEnterpriseControl() {
  const businessUnits = useQuery({ queryKey: ["business-units"], queryFn: getBusinessUnits });
  const accessCerts = useQuery({ queryKey: ["access-cert-campaigns"], queryFn: getAccessCertCampaigns });
  const recert = useQuery({ queryKey: ["recert-summary"], queryFn: getRecertificationSummary });
  const sod = useQuery({ queryKey: ["sod-findings"], queryFn: getSodFindings });

  return { businessUnits, accessCerts, recert, sod };
}

export type EnterpriseData = ReturnType<typeof useEnterpriseControl>;

/** POST /api/v1/compliance/business-units — BU list + KPI refresh without a reload. */
export function useCreateBusinessUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BusinessUnitCreatePayload) => createBusinessUnit(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-units"] });
    }
  });
}

/** POST /api/v1/access-certifications/campaigns — campaigns panel refreshes without a reload. */
export function useCreateAccessCertCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AccessCertCampaignCreatePayload) => createAccessCertCampaign(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access-cert-campaigns"] });
    }
  });
}
