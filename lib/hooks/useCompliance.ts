"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getFrameworks,
  getObligations,
  getComplianceEvidence,
  getRisks,
  getCertifications,
  getComplianceOverview,
  getComplianceGaps,
  getComplianceScore
} from "@/lib/api/compliance";
import { getScoresSummary, getRegulatoryDeadlines, getControlCenterFeed } from "@/lib/api/command";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn });
}

export function useCompliance() {
  const frameworks = useEndpoint("cmp-frameworks", getFrameworks);
  const obligations = useEndpoint("cmp-obligations", getObligations);
  const evidence = useEndpoint("cmp-evidence", getComplianceEvidence);
  const risks = useEndpoint("cmp-risks", getRisks);
  const certifications = useEndpoint("cmp-certifications", getCertifications);
  const overview = useEndpoint("cmp-overview", getComplianceOverview);
  const gaps = useEndpoint("cmp-gaps", getComplianceGaps);
  const score = useEndpoint("cmp-score", getComplianceScore);
  const scores = useEndpoint("scores-summary", getScoresSummary);
  const deadlines = useEndpoint("regulatory-deadlines", getRegulatoryDeadlines);
  const feed = useEndpoint("control-center-feed", getControlCenterFeed);

  return { frameworks, obligations, evidence, risks, certifications, overview, gaps, score, scores, deadlines, feed };
}

export type Compliance = ReturnType<typeof useCompliance>;
