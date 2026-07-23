"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBillingStatus,
  getBillingPlans,
  getUsageDashboard,
  getInvoices,
  getCarbonDashboard,
  ingestCarbonReading,
  redeemTrialCode,
  setUsageSpendCap,
  type CarbonReadingPayload,
  type SpendCapPayload
} from "@/lib/api/billing";

export function useBilling() {
  const status = useQuery({ queryKey: ["billing-status"], queryFn: getBillingStatus });
  const plans = useQuery({ queryKey: ["billing-plans"], queryFn: getBillingPlans });
  const usage = useQuery({ queryKey: ["billing-usage"], queryFn: getUsageDashboard });
  const invoices = useQuery({ queryKey: ["billing-invoices"], queryFn: getInvoices });
  const carbon = useQuery({ queryKey: ["carbon-dashboard"], queryFn: getCarbonDashboard });

  return { status, plans, usage, invoices, carbon };
}

export type BillingData = ReturnType<typeof useBilling>;

/** POST /api/v1/billing/usage/spend-cap — the usage dashboard reflects the new cap. */
export function useSetSpendCap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SpendCapPayload) => setUsageSpendCap(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-usage"] });
    }
  });
}

/** POST /api/v1/billing/redeem-trial-code — on success the org becomes Trial
 * with all features unlocked. We invalidate every entitlement-bearing cache so
 * the UI immediately reflects the new plan/features without a manual reload:
 * billing status (plan/features/record_usage), plans, usage, and permissions. */
export function useRedeemTrialCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => redeemTrialCode(code.trim()),
    onSuccess: (status) => {
      // Seed the fresh status so consumers update instantly, then invalidate to
      // refetch anything else that depends on entitlement.
      queryClient.setQueryData(["billing-status"], status);
      queryClient.invalidateQueries({ queryKey: ["billing-status"] });
      queryClient.invalidateQueries({ queryKey: ["billing-plans"] });
      queryClient.invalidateQueries({ queryKey: ["billing-usage"] });
      queryClient.invalidateQueries({ queryKey: ["my-permissions"] });
    }
  });
}

/** POST /api/v1/carbon-accounting/readings — scope totals + reading count refresh. */
export function useIngestCarbonReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CarbonReadingPayload) => ingestCarbonReading(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carbon-dashboard"] });
    }
  });
}
