"use client";

import { useQuery } from "@tanstack/react-query";
import { getEvidence, getEvidenceReadinessSummary, getEvidenceReadinessGaps } from "@/lib/api/evidence";

export function useEvidence() {
  const evidence = useQuery({ queryKey: ["evidence"], queryFn: () => getEvidence() });
  const readiness = useQuery({ queryKey: ["evidence-readiness"], queryFn: getEvidenceReadinessSummary });
  const gaps = useQuery({ queryKey: ["evidence-gaps"], queryFn: () => getEvidenceReadinessGaps(20) });

  return { evidence, readiness, gaps };
}

export type EvidenceData = ReturnType<typeof useEvidence>;
