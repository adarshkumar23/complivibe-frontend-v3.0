"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getPrivacySummary, getPrivacyRequests, getPrivacyRetention, getPrivacyDataMap,
  getDataObsSensitive, getComplianceOverview, getComplianceEvidence, getRegulatoryDeadlines,
  getPolicies, getTrustCenter, getCertifications
} from "@/lib/api/privacy";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn, retry: false });
}

export function usePrivacy() {
  const summary = useEndpoint("privacy-summary", getPrivacySummary);
  const requests = useEndpoint("privacy-requests", getPrivacyRequests);
  const retention = useEndpoint("privacy-retention", getPrivacyRetention);
  const dataMap = useEndpoint("privacy-data-map", getPrivacyDataMap);

  const sensitive = useEndpoint("data-obs-sensitive", getDataObsSensitive);
  const overview = useEndpoint("cmp-overview", getComplianceOverview);
  const evidence = useEndpoint("cmp-evidence", getComplianceEvidence);
  const regulatory = useEndpoint("regulatory-deadlines", getRegulatoryDeadlines);
  const policies = useEndpoint("policies", getPolicies);
  const trustCenter = useEndpoint("trust-center", getTrustCenter);
  const certifications = useEndpoint("certifications", getCertifications);

  return { summary, requests, retention, dataMap, sensitive, overview, evidence, regulatory, policies, trustCenter, certifications };
}

export type PrivacyData = ReturnType<typeof usePrivacy>;
