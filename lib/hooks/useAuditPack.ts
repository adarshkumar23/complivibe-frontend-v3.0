"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAuditEngagements,
  getAuditEngagementsDashboard,
  getAuditFindingsSummary,
  getPbcItemsSummary
} from "@/lib/api/audit-pack";

export function useAuditPack() {
  const engagements = useQuery({ queryKey: ["audit-engagements"], queryFn: () => getAuditEngagements() });
  const dashboard = useQuery({ queryKey: ["audit-engagements-dashboard"], queryFn: getAuditEngagementsDashboard });
  const findings = useQuery({ queryKey: ["audit-findings-summary"], queryFn: getAuditFindingsSummary });
  const pbc = useQuery({ queryKey: ["pbc-summary"], queryFn: getPbcItemsSummary });

  return { engagements, dashboard, findings, pbc };
}

export type AuditPackData = ReturnType<typeof useAuditPack>;
