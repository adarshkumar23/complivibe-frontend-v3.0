"use client";

import { useQuery } from "@tanstack/react-query";
import { getBillingStatus, getBillingPlans, getUsageDashboard, getInvoices, getCarbonDashboard } from "@/lib/api/billing";

export function useBilling() {
  const status = useQuery({ queryKey: ["billing-status"], queryFn: getBillingStatus });
  const plans = useQuery({ queryKey: ["billing-plans"], queryFn: getBillingPlans });
  const usage = useQuery({ queryKey: ["billing-usage"], queryFn: getUsageDashboard });
  const invoices = useQuery({ queryKey: ["billing-invoices"], queryFn: getInvoices });
  const carbon = useQuery({ queryKey: ["carbon-dashboard"], queryFn: getCarbonDashboard });

  return { status, plans, usage, invoices, carbon };
}

export type BillingData = ReturnType<typeof useBilling>;
