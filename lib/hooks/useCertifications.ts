"use client";

import { useQuery } from "@tanstack/react-query";
import { getCertifications } from "@/lib/api/certifications";
import { getComplianceEvidence } from "@/lib/api/compliance";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn });
}

export function useCertifications() {
  const certifications = useEndpoint("certifications", getCertifications);
  const evidence = useEndpoint("cmp-evidence", getComplianceEvidence);

  return { certifications, evidence };
}

export type CertificationsData = ReturnType<typeof useCertifications>;
