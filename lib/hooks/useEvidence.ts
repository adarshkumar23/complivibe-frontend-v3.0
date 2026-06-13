"use client";

import { useQuery } from "@tanstack/react-query";
import { getEvidenceList } from "@/lib/api/evidence";
import { getFrameworks } from "@/lib/api/compliance";
import { getAiSystems } from "@/lib/api/ai-systems";
import { getScoresSummary } from "@/lib/api/command";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn });
}

export function useEvidence() {
  const evidence = useEndpoint("evidence-vault", getEvidenceList);
  const frameworks = useEndpoint("cmp-frameworks", getFrameworks);
  const aiSystems = useEndpoint("ai-systems", getAiSystems);
  const scores = useEndpoint("scores-summary", getScoresSummary);

  return { evidence, frameworks, aiSystems, scores };
}

export type EvidenceData = ReturnType<typeof useEvidence>;
