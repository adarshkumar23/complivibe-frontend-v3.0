"use client";

import { useQuery } from "@tanstack/react-query";
import { getBusinessUnits, getAccessCertCampaigns, getRecertificationSummary } from "@/lib/api/enterprise";
import { getSodFindings } from "@/lib/api/security";

export function useEnterpriseControl() {
  const businessUnits = useQuery({ queryKey: ["business-units"], queryFn: getBusinessUnits });
  const accessCerts = useQuery({ queryKey: ["access-cert-campaigns"], queryFn: getAccessCertCampaigns });
  const recert = useQuery({ queryKey: ["recert-summary"], queryFn: getRecertificationSummary });
  const sod = useQuery({ queryKey: ["sod-findings"], queryFn: getSodFindings });

  return { businessUnits, accessCerts, recert, sod };
}

export type EnterpriseData = ReturnType<typeof useEnterpriseControl>;
