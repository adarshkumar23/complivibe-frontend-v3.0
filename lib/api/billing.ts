import { apiFetch, ApiError, type ApiErrorPayload } from "@/lib/api/client";

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

// ── POST /api/v1/carbon-accounting/api-key ──────────────────────────────────
/**
 * Provisions (or rotates) this org's carbon ingest API key. The readings
 * endpoint authenticates ONLY via X-CompliVibe-Key — not the bearer token —
 * so the UI provisions a key once and keeps it in local storage.
 */
export function provisionCarbonApiKey() {
  return apiFetch<{ api_key: string; header_name: string }>("/api/v1/carbon-accounting/api-key", {
    method: "POST",
    body: JSON.stringify({})
  });
}

// ── POST /api/v1/carbon-accounting/readings (CarbonEmissionsReadingIngest) ──
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

const CARBON_KEY_STORAGE = "cv_carbon_key";

/**
 * Raw fetch for the readings ingest: it must NOT go through apiFetch because
 * apiFetch treats any 401 on a token-bearing request as an expired session and
 * redirects to /login — a stale ingest key would log the user out. Instead we
 * send only X-CompliVibe-Key, and on 401 provision a fresh key (bearer-authed)
 * and retry once.
 */
async function postReading(key: string, payload: CarbonReadingPayload): Promise<CarbonReading> {
  const response = await fetch("/api/proxy/api/v1/carbon-accounting/readings", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CompliVibe-Key": key },
    body: JSON.stringify(payload),
    cache: "no-store"
  });
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }
  if (!response.ok) {
    const typed = (body || {}) as ApiErrorPayload;
    const detail = typeof typed.detail === "string" ? typed.detail : undefined;
    throw new ApiError(typed.message || detail || `Request failed with status ${response.status}`, response.status, typed);
  }
  return body as CarbonReading;
}

export async function ingestCarbonReading(payload: CarbonReadingPayload): Promise<CarbonReading> {
  let key = typeof window !== "undefined" ? localStorage.getItem(CARBON_KEY_STORAGE) : null;
  if (!key) {
    key = (await provisionCarbonApiKey()).api_key;
    localStorage.setItem(CARBON_KEY_STORAGE, key);
  }
  try {
    return await postReading(key, payload);
  } catch (err) {
    // Stale/rotated key → provision a new one and retry exactly once.
    if (err instanceof ApiError && err.status === 401) {
      const fresh = (await provisionCarbonApiKey()).api_key;
      localStorage.setItem(CARBON_KEY_STORAGE, fresh);
      return postReading(fresh, payload);
    }
    throw err;
  }
}
