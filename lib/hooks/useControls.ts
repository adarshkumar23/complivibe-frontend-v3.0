"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getControls,
  getControlGapsSummary,
  getControlTestsSummary,
  getFrameworkCoverageMatrix,
  createControl,
  updateControl,
  archiveControl,
  mapControlToObligation,
  linkControlToPolicy,
  type ControlCreateInput,
  type ControlUpdateInput,
  type ControlObligationMapInput
} from "@/lib/api/controls";
import { getActiveFrameworks } from "@/lib/api/frameworks";
import { getPolicies } from "@/lib/api/policies";
import { usePlan } from "@/lib/hooks/usePlan";

export function useControls() {
  // Control Test Health is gated by the paid `audit_assurance` feature. Fire the
  // summary request ONLY once the plan is known AND entitled, so a Free user never
  // calls GET /control-tests/summary (which 403s and surfaces as a red console
  // error). `isReady` gates out the pre-load window where hasFeature optimistically
  // returns true; entitled users still load the real summary the moment status resolves.
  const { hasFeature, isReady } = usePlan();
  const testsEntitled = isReady && hasFeature("audit_assurance");
  const testsLocked = isReady && !hasFeature("audit_assurance");

  const controls = useQuery({ queryKey: ["controls"], queryFn: () => getControls() });
  const gaps = useQuery({ queryKey: ["control-gaps"], queryFn: getControlGapsSummary });
  const tests = useQuery({
    queryKey: ["control-tests-summary"],
    queryFn: getControlTestsSummary,
    enabled: testsEntitled,
  });

  return { controls, gaps, tests, testsLocked };
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

/** PATCH /api/v1/controls/{id} (edit) */
export function useUpdateControl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ controlId, body }: { controlId: string; body: ControlUpdateInput }) => updateControl(controlId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["controls"] });
      qc.invalidateQueries({ queryKey: ["control-gaps"] });
      qc.invalidateQueries({ queryKey: ["control-tests-summary"] });
    }
  });
}

/** PATCH /api/v1/controls/{id}/archive (retire) */
export function useArchiveControl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (controlId: string) => archiveControl(controlId),
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
