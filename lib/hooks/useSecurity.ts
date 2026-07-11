"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createNonHumanIdentity,
  getNonHumanIdentities,
  getNhiSummary,
  getScanJobs,
  getScanJobsSummary,
  getSodFindings,
  type NhiCreatePayload
} from "@/lib/api/security";

export function useSecurity() {
  const scanSummary = useQuery({ queryKey: ["scan-jobs-summary"], queryFn: getScanJobsSummary });
  const scanJobs = useQuery({ queryKey: ["scan-jobs"], queryFn: () => getScanJobs() });
  const nhi = useQuery({ queryKey: ["nhi-summary"], queryFn: getNhiSummary });
  const nhiList = useQuery({ queryKey: ["nhi-list"], queryFn: () => getNonHumanIdentities() });
  const sod = useQuery({ queryKey: ["sod-findings"], queryFn: getSodFindings });

  return { scanSummary, scanJobs, nhi, nhiList, sod };
}

export type SecurityData = ReturnType<typeof useSecurity>;

/** POST /api/v1/non-human-identities — list + summary KPIs refresh without a reload. */
export function useCreateNhi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NhiCreatePayload) => createNonHumanIdentity(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nhi-summary"] });
      queryClient.invalidateQueries({ queryKey: ["nhi-list"] });
    }
  });
}
