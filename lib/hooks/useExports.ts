"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getExportJobs,
  createExportJob,
  runExportJob,
  cancelExportJob,
  verifyExportJob,
  downloadExportPackage,
  type ExportCreatePayload,
  type ExportVerifyResponse
} from "@/lib/api/exports";

const LIST_KEY = ["export-jobs"] as const;

/** GET /api/v1/exports/jobs — list is WRAPPED in {jobs}; select unwraps it. */
export function useExportJobs() {
  return useQuery({
    queryKey: LIST_KEY,
    queryFn: () => getExportJobs(50),
    select: (data) => data.jobs
  });
}

function invalidateExports(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: LIST_KEY });
}

/** POST /api/v1/exports/jobs */
export function useCreateExportJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExportCreatePayload) => createExportJob(payload),
    onSuccess: () => invalidateExports(queryClient)
  });
}

/** POST /api/v1/exports/jobs/{id}/run — builds + signs the package. */
export function useRunExportJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => runExportJob(id),
    onSuccess: () => invalidateExports(queryClient)
  });
}

/** POST /api/v1/exports/jobs/{id}/cancel */
export function useCancelExportJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => cancelExportJob(id, reason),
    onSuccess: () => invalidateExports(queryClient)
  });
}

/**
 * POST /api/v1/exports/jobs/{id}/verify — returns the verify result so callers can
 * render the distinct valid / expired / revoked / invalid_signature / checksum_mismatch
 * state. Does not mutate the list, so no invalidation.
 */
export function useVerifyExportJob() {
  return useMutation<ExportVerifyResponse, unknown, string>({
    mutationFn: (id: string) => verifyExportJob(id)
  });
}

/** Download helper — fetches the signed package and saves package_json as a .json file. */
export function useDownloadExportPackage() {
  return useMutation({
    mutationFn: ({ id, filenameBase }: { id: string; filenameBase?: string }) =>
      downloadExportPackage(id, filenameBase)
  });
}
