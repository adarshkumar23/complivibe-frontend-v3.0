"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBillingStatus,
  getBillingPlans,
  getUsageDashboard,
  getInvoices,
  getCarbonDashboard,
  ingestCarbonReading,
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
