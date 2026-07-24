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
    // /billing/status gates EVERY plan-locked route, so a transient failure must
    // not strand the user on an infinite spinner (the global default is retry:1).
    // Retry a few times with exponential backoff (~1s/2s/4s) so most blips resolve
    // invisibly; only after these are exhausted does isError surface, letting the
    // guard show a retry state instead of hanging forever.
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });
}

export type PlanUtils = {
  plan: string | undefined;
  isTrial: boolean;
  trialDaysRemaining: number | null;
  trialEndsAt: string | null;
  // True when the org is on Free but previously had a trial (trial_ends_at is
  // set and in the past) -- i.e. it LAPSED from trial. Distinct from a
  // never-trialed Free org (trial_ends_at null).
  lapsedFromTrial: boolean;
  isReady: boolean;
  // Distinguishes "still loading (incl. retrying)" from "failed after retries".
  // Consumers that gate a whole route (RouteFeatureGuard) must treat isError as a
  // retryable infra hiccup, NOT as a tier lock, and NOT as a permanent spinner.
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  hasFeature: (flag: string) => boolean;
  recordUsage: BillingStatus["record_usage"];
  recordCaps: Record<string, number | undefined>;
};

/** Plan/entitlement utilities derived from /billing/status. Distinct from RBAC
 * permissions (usePermissions) -- this is the org's plan/features axis. */
export function usePlan(): PlanUtils {
  const { data, isSuccess, isError, isLoading, refetch } = useBillingStatusQuery();
  return useMemo(() => {
    const features = (data?.features ?? {}) as Record<string, unknown>;
    const trialEndsAt = data?.trial_ends_at ?? null;
    const lapsedFromTrial =
      data?.plan === "free" && !data?.is_trial && !!trialEndsAt && new Date(trialEndsAt).getTime() < Date.now();
    return {
      plan: data?.plan,
      isTrial: Boolean(data?.is_trial),
      trialDaysRemaining: data?.trial_days_remaining ?? null,
      trialEndsAt,
      lapsedFromTrial,
      isReady: isSuccess,
      isLoading,
      isError,
      refetch,
      // Before the status loads, treat features as AVAILABLE so entitled users
      // (the majority) never flash a lock. Locks only render once we know the plan.
      hasFeature: (flag: string) => (isSuccess ? Boolean(features[flag]) : true),
      recordUsage: data?.record_usage,
      recordCaps: (features.record_caps ?? {}) as Record<string, number | undefined>,
    };
  }, [data, isSuccess, isError, isLoading, refetch]);
}
