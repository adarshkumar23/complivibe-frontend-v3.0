import { apiFetch } from "@/lib/api/client";

/**
 * Billing + Carbon accounting API — typed against the live backend schema
 * (/api/v1/billing/*, /api/v1/carbon-accounting/*).
 */

// ── GET /api/v1/billing/status ──────────────────────────────────────────────
export type BillingStatus = {
  subscription_status: string;
  plan: string;
  is_trial: boolean;
  trial_days_remaining: number | null;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  renewal_days_remaining: number | null;
  features: Record<string, unknown>;
};

export function getBillingStatus() {
  return apiFetch<BillingStatus>("/api/v1/billing/status");
}

// ── GET /api/v1/billing/plans ───────────────────────────────────────────────
export type BillingPlan = {
  id: string;
  plan_code: string;
  display_name: string;
  plan_type: string;
  price_inr_monthly: number;
  price_inr_annual: number;
  usage_unit_price_inr: number | null;
  max_users: number | null;
  max_frameworks: number | null;
  max_ai_systems: number | null;
  features: Record<string, unknown>;
};

export function getBillingPlans() {
  return apiFetch<BillingPlan[]>("/api/v1/billing/plans");
}

// ── GET /api/v1/billing/usage/dashboard ─────────────────────────────────────
export type UsageDashboard = {
  period_start: string;
  period_end: string;
  active_frameworks_count: number;
  active_users_count: number;
  api_calls_count: number;
  billable_units: number;
  unit_price_inr: number;
  current_estimated_cost_inr: number;
  projected_month_end_cost_inr: number;
  usage_spend_cap_enabled: boolean;
  usage_spend_cap_inr: number | null;
  is_spend_cap_breached: boolean;
  spend_cap_alert: string | null;
  is_usage_based_plan: boolean;
  cost_trend: string | null;
};

export function getUsageDashboard() {
  return apiFetch<UsageDashboard>("/api/v1/billing/usage/dashboard");
}

// ── GET /api/v1/billing/invoices ────────────────────────────────────────────
export type Invoice = {
  id: string;
  amount_inr?: number | null;
  status?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

export function getInvoices() {
  return apiFetch<Invoice[]>("/api/v1/billing/invoices");
}

// ── GET /api/v1/carbon-accounting/dashboard ─────────────────────────────────
export type CarbonDashboard = {
  totals_by_scope: Record<string, number>;
  totals_by_scope3_category: unknown[];
  totals_by_period: { period?: string; total?: number }[];
  totals_by_business_unit: unknown[];
  reading_count: number;
  canonical_unit: string;
  insights: unknown[];
};

export function getCarbonDashboard() {
  return apiFetch<CarbonDashboard>("/api/v1/carbon-accounting/dashboard");
}
