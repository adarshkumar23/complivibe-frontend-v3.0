"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getVendors,
  getVendorRiskSummary,
  getVendorConcentrationRisk,
  createVendor,
  updateVendor,
  createVendorAssessment,
  recomputeVendorConcentrationRisk,
  type VendorCreatePayload,
  type VendorUpdatePayload,
  type VendorAssessmentCreatePayload
} from "@/lib/api/vendor-risk";
import { getOrgUsers } from "@/lib/api/users";

export function useVendorRisk() {
  const vendors = useQuery({ queryKey: ["vendors"], queryFn: () => getVendors() });
  const summary = useQuery({ queryKey: ["vendor-summary"], queryFn: getVendorRiskSummary });
  const concentration = useQuery({ queryKey: ["vendor-concentration"], queryFn: getVendorConcentrationRisk });

  return { vendors, summary, concentration };
}

export type VendorRiskData = ReturnType<typeof useVendorRisk>;

/** Org members for the vendor-owner / assessment-assignee pickers (GET /api/v1/users). */
export function useVendorOwners() {
  return useQuery({ queryKey: ["org-users"], queryFn: () => getOrgUsers() });
}

/** Refetch every vendor-derived view so the register, KPIs, and tier mix update without a reload. */
function invalidateVendorQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["vendors"] });
  queryClient.invalidateQueries({ queryKey: ["vendor-summary"] });
  queryClient.invalidateQueries({ queryKey: ["vendor-concentration"] });
}

/** POST /api/v1/compliance/vendors */
export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VendorCreatePayload) => createVendor(payload),
    onSuccess: () => invalidateVendorQueries(queryClient)
  });
}

/** PATCH /api/v1/compliance/vendors/{vendor_id} — partial, send only changed fields. */
export function useUpdateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, payload }: { vendorId: string; payload: VendorUpdatePayload }) =>
      updateVendor(vendorId, payload),
    onSuccess: () => invalidateVendorQueries(queryClient)
  });
}

/** POST /api/v1/compliance/vendors/{vendor_id}/assessments */
export function useCreateVendorAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, payload }: { vendorId: string; payload: VendorAssessmentCreatePayload }) =>
      createVendorAssessment(vendorId, payload),
    // A past due_date immediately flips the vendor's has_overdue_assessment flag,
    // so the register + overdue KPI must refetch too.
    onSuccess: () => invalidateVendorQueries(queryClient)
  });
}

/** POST /api/v1/vendor-concentration-risk/recompute — real HHI from vendor tiers, links, and spend. */
export function useRecomputeConcentration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (thresholdHhiScore?: number) => recomputeVendorConcentrationRisk(thresholdHhiScore),
    onSuccess: (result) => {
      // Seed the fresh detection straight into the cache, then revalidate.
      queryClient.setQueryData(["vendor-concentration"], result.detection);
      queryClient.invalidateQueries({ queryKey: ["vendor-concentration"] });
      // A breach recompute can create a risk-register entry.
      queryClient.invalidateQueries({ queryKey: ["risks"] });
      queryClient.invalidateQueries({ queryKey: ["risk-summary"] });
    }
  });
}
