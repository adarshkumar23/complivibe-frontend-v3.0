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
  // Current per-resource counts for the capped core resources, so the UI can
  // show "3 of 5 used". Pairs with features.record_caps (the limit).
  record_usage?: Partial<Record<"policies" | "controls" | "evidence" | "risks", number>>;
};

export function getBillingStatus() {
  return apiFetch<BillingStatus>("/api/v1/billing/status");
}

// ── POST /api/v1/billing/redeem-trial-code ──────────────────────────────────
/** Redeem a single-use trial code. Returns the refreshed billing status
 * (plan="trial") on success; throws ApiError with a structured detail.error
 * (invalid_code / code_already_used / already_trialed / not_eligible) otherwise. */
export function redeemTrialCode(code: string) {
  return apiFetch<BillingStatus>("/api/v1/billing/redeem-trial-code", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
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

// ── POST /api/v1/billing/usage/spend-cap (UsageSpendCapUpdateRequest) ───────
export type SpendCapPayload = {
  usage_spend_cap_enabled: boolean;
  usage_spend_cap_inr?: number | null;
};

export function setUsageSpendCap(payload: SpendCapPayload) {
  return apiFetch<Record<string, unknown>>("/api/v1/billing/usage/spend-cap", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// ── POST /api/v1/carbon-accounting/readings/manual (CarbonEmissionsReadingIngest) ──
/** GHG Protocol Scope 3 categories accepted for new ingests (backend rejects "unspecified_legacy"). */
export const SCOPE3_CATEGORIES = [
  "purchased_goods_and_services",
  "capital_goods",
  "fuel_and_energy_related_activities",
  "upstream_transportation_and_distribution",
  "waste_generated_in_operations",
  "business_travel",
  "employee_commuting",
  "upstream_leased_assets",
  "downstream_transportation_and_distribution",
  "processing_of_sold_products",
  "use_of_sold_products",
  "end_of_life_treatment_of_sold_products",
  "downstream_leased_assets",
  "franchises",
  "investments"
] as const;

/** Units accepted by the backend (422 "Unsupported emissions unit" otherwise). */
export const EMISSION_UNITS = ["kgCO2e", "tCO2e", "MTCO2e"] as const;

export type CarbonReadingPayload = {
  scope: "scope1" | "scope2" | "scope3";
  scope3_category?: string | null;
  source: string;
  period_start: string; // date
  period_end: string; // date
  value: number;
  unit: (typeof EMISSION_UNITS)[number];
};

export type CarbonReading = {
  id: string;
  scope: string;
  scope3_category: string | null;
  source: string;
  period_start: string;
  period_end: string;
  value: string;
  unit: string;
  ingested_at: string;
};

/**
 * Interactive reading entry for the signed-in user. Authenticates via the normal
 * session (httpOnly cookie + CSRF, handled by apiFetch) against the session-authed
 * /readings/manual endpoint, so NO machine ingest key is ever provisioned into,
 * cached in (localStorage), or transmitted from the browser. The machine ingest-key
 * header and the key-authed /readings endpoint remain backend-only, for
 * external/automated ingest.
 *
 * A 401 here now correctly means the user's session expired, so apiFetch's
 * redirect-to-login is the right behaviour (previously avoided because a stale
 * ingest key would have logged the user out).
 */
export async function ingestCarbonReading(payload: CarbonReadingPayload): Promise<CarbonReading> {
  return apiFetch<CarbonReading>("/api/v1/carbon-accounting/readings/manual", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
