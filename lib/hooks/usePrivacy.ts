"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getConsentSummary,
  getDsrRequests,
  getDsrSummary,
  getDpiaSummary,
  getDpaSummary,
  getRopaSummary,
  getLawfulBasisSummary,
  getCommonControlsSummary
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
