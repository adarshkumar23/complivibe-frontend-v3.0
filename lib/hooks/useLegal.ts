"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createLegalMatter,
  getLegalMatters,
  getWhistleblowerReports,
  submitWhistleblowerReport,
  type LegalMatterCreatePayload,
  type WhistleblowerCategory
} from "@/lib/api/legal";

export function useLegal() {
  const matters = useQuery({ queryKey: ["legal-matters"], queryFn: () => getLegalMatters() });
  const reports = useQuery({ queryKey: ["wb-reports"], queryFn: () => getWhistleblowerReports() });

  return { matters, reports };
}

export type LegalData = ReturnType<typeof useLegal>;

/** POST /api/v1/legal-matters — refresh the matters table without a reload. */
export function useCreateLegalMatter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LegalMatterCreatePayload) => createLegalMatter(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal-matters"] });
    }
  });
}

/** POST /api/v1/whistleblower/submit — refresh the reports panel without a reload. */
export function useSubmitWhistleblowerReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { category: WhistleblowerCategory; description: string }) =>
      submitWhistleblowerReport(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wb-reports"] });
    }
  });
}
