"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getControls,
  getControlGapsSummary,
  getControlTestsSummary,
  getFrameworkCoverageMatrix,
  createControl,
  mapControlToObligation,
  linkControlToPolicy,
  type ControlCreateInput,
  type ControlObligationMapInput
} from "@/lib/api/controls";
import { getActiveFrameworks } from "@/lib/api/frameworks";
import { getPolicies } from "@/lib/api/policies";

export function useControls() {
  const controls = useQuery({ queryKey: ["controls"], queryFn: () => getControls() });
  const gaps = useQuery({ queryKey: ["control-gaps"], queryFn: getControlGapsSummary });
  const tests = useQuery({ queryKey: ["control-tests-summary"], queryFn: getControlTestsSummary });

  return { controls, gaps, tests };
}

export type ControlsData = ReturnType<typeof useControls>;

/** Frameworks activated for this org — the ones whose obligations count toward the gap summary. */
export function useActiveFrameworks(enabled = true) {
  return useQuery({ queryKey: ["frameworks-active"], queryFn: getActiveFrameworks, enabled });
}

/** Per-obligation control coverage for one framework (GET /api/v1/reports/framework-coverage-matrix). */
export function useFrameworkCoverage(frameworkId: string | null) {
  return useQuery({
    queryKey: ["framework-coverage", frameworkId],
    queryFn: () => getFrameworkCoverageMatrix(frameworkId as string),
    enabled: frameworkId != null && frameworkId !== ""
  });
}

/** Policies list, for the link-control-to-policy flow. Shares the policies page query key. */
export function usePoliciesList(enabled = true) {
  return useQuery({ queryKey: ["policies"], queryFn: () => getPolicies(), enabled });
}

/** POST /api/v1/controls */
export function useCreateControl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ControlCreateInput) => createControl(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["controls"] });
      qc.invalidateQueries({ queryKey: ["control-gaps"] });
      qc.invalidateQueries({ queryKey: ["control-tests-summary"] });
    }
  });
}

/** POST /api/v1/controls/{id}/obligations — refreshes gap summary + coverage matrix. */
export function useMapControlToObligation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ controlId, body }: { controlId: string; body: ControlObligationMapInput }) =>
      mapControlToObligation(controlId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["control-gaps"] });
      qc.invalidateQueries({ queryKey: ["framework-coverage"] });
      qc.invalidateQueries({ queryKey: ["controls"] });
    }
  });
}

/** POST /api/v1/compliance/policies/{policy_id}/links/controls */
export function useLinkControlToPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ policyId, body }: { policyId: string; body: { control_id: string; link_reason?: string | null } }) =>
      linkControlToPolicy(policyId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["policies"] });
    }
  });
}
