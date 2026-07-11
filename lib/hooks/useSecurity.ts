"use client";

import { useQuery } from "@tanstack/react-query";
import { getScanJobsSummary, getScanJobs, getNhiSummary, getSodFindings } from "@/lib/api/security";

export function useSecurity() {
  const scanSummary = useQuery({ queryKey: ["scan-jobs-summary"], queryFn: getScanJobsSummary });
  const scanJobs = useQuery({ queryKey: ["scan-jobs"], queryFn: () => getScanJobs() });
  const nhi = useQuery({ queryKey: ["nhi-summary"], queryFn: getNhiSummary });
  const sod = useQuery({ queryKey: ["sod-findings"], queryFn: getSodFindings });

  return { scanSummary, scanJobs, nhi, sod };
}

export type SecurityData = ReturnType<typeof useSecurity>;
