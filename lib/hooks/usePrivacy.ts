"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getConsentSummary,
  getDsrRequests,
  getDsrSummary,
  getDpiaSummary,
  getDpaSummary,
  getRopaSummary,
  getLawfulBasisSummary,
  getCommonControlsSummary,
  getRopaActivities,
  createConsent,
  createDsr,
  type ConsentCreateInput,
  type DsrCreateInput
} from "@/lib/api/privacy";

export function usePrivacy() {
  const consent = useQuery({ queryKey: ["consent-summary"], queryFn: getConsentSummary });
  const dsr = useQuery({ queryKey: ["dsr-requests"], queryFn: () => getDsrRequests() });
  const dsrSummary = useQuery({ queryKey: ["dsr-summary"], queryFn: getDsrSummary });
  const dpias = useQuery({ queryKey: ["dpia-summary"], queryFn: getDpiaSummary });
  const dpas = useQuery({ queryKey: ["dpa-summary"], queryFn: getDpaSummary });
  const ropa = useQuery({ queryKey: ["ropa-summary"], queryFn: getRopaSummary });
  const lawfulBasis = useQuery({ queryKey: ["lawful-basis-summary"], queryFn: getLawfulBasisSummary });
  const commonControls = useQuery({ queryKey: ["common-controls-summary"], queryFn: getCommonControlsSummary });

  return { consent, dsr, dsrSummary, dpias, dpas, ropa, lawfulBasis, commonControls };
}

export type PrivacyData = ReturnType<typeof usePrivacy>;

/** RoPA processing activities — consent records must reference one. */
export function useRopaActivities() {
  return useQuery({ queryKey: ["ropa-activities"], queryFn: getRopaActivities });
}

/** POST /api/v1/privacy/consent — refreshes consent KPIs without a reload. */
export function useCreateConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ConsentCreateInput) => createConsent(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consent-summary"] });
    }
  });
}

/** POST /api/v1/privacy/dsr — DSARs and DPDP grievances (request_subtype = "grievance"). */
export function useCreateDsr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: DsrCreateInput) => createDsr(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dsr-requests"] });
      queryClient.invalidateQueries({ queryKey: ["dsr-summary"] });
    }
  });
}
