"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBillingStatus, type BillingStatus } from "@/lib/api/billing";

/** Shared billing-status query. Same ["billing-status"] key the Stage-2 redeem
 * flow seeds + invalidates, so locks clear the instant a trial is redeemed. */
export function useBillingStatusQuery() {
  return useQuery({
    queryKey: ["billing-status"],
    queryFn: getBillingStatus,
    staleTime: 300_000,
    refetchOnWindowFocus: "always",
  });
}

export type PlanUtils = {
  plan: string | undefined;
  isTrial: boolean;
  trialDaysRemaining: number | null;
  isReady: boolean;
  hasFeature: (flag: string) => boolean;
  recordUsage: BillingStatus["record_usage"];
  recordCaps: Record<string, number | undefined>;
};

/** Plan/entitlement utilities derived from /billing/status. Distinct from RBAC
 * permissions (usePermissions) -- this is the org's plan/features axis. */
export function usePlan(): PlanUtils {
  const { data, isSuccess } = useBillingStatusQuery();
  return useMemo(() => {
    const features = (data?.features ?? {}) as Record<string, unknown>;
    return {
      plan: data?.plan,
      isTrial: Boolean(data?.is_trial),
      trialDaysRemaining: data?.trial_days_remaining ?? null,
      isReady: isSuccess,
      // Before the status loads, treat features as AVAILABLE so entitled users
      // (the majority) never flash a lock. Locks only render once we know the plan.
      hasFeature: (flag: string) => (isSuccess ? Boolean(features[flag]) : true),
      recordUsage: data?.record_usage,
      recordCaps: (features.record_caps ?? {}) as Record<string, number | undefined>,
    };
  }, [data, isSuccess]);
}
