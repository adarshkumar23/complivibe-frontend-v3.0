"use client";

import { CreditCard, Timer, Gauge, Leaf } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import type { BillingData } from "@/lib/hooks/useBilling";

export function BillingKpis({ data }: { data: BillingData }) {
  const { status, usage, carbon } = data;
  const s = status.data;
  const u = usage.data;
  const c = carbon.data;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi
        label="Trial Days Left"
        icon={Timer}
        accent="amber"
        value={s ? (s.is_trial ? s.trial_days_remaining : s.renewal_days_remaining) : null}
        caption={s ? (s.is_trial ? `${s.plan} plan trial` : `renews the ${s.plan} plan`) : undefined}
        loading={status.isLoading}
        unavailableHint="Billing status unavailable"
      />
      <RegistryKpi
        label="API Calls (period)"
        icon={Gauge}
        accent="blue"
        value={u ? u.api_calls_count : null}
        caption={u ? `${u.active_users_count} active users · ${u.active_frameworks_count} frameworks` : undefined}
        loading={usage.isLoading}
        unavailableHint="Usage dashboard unavailable"
      />
      <RegistryKpi
        label="Billable Units"
        icon={CreditCard}
        accent="purple"
        value={u ? Math.round(u.billable_units) : null}
        caption={
          u
            ? [
                u.is_usage_based_plan
                  ? `₹${u.projected_month_end_cost_inr} projected month-end`
                  : "flat plan — units informational",
                u.usage_spend_cap_enabled && u.usage_spend_cap_inr != null
                  ? `cap ₹${u.usage_spend_cap_inr}${u.is_spend_cap_breached ? " (breached)" : ""}`
                  : null
              ]
                .filter(Boolean)
                .join(" · ")
            : undefined
        }
        loading={usage.isLoading}
        unavailableHint="Usage dashboard unavailable"
      />
      <RegistryKpi
        label="Carbon Readings"
        icon={Leaf}
        accent="green"
        value={c ? c.reading_count : null}
        caption={c && c.reading_count === 0 ? "connect meters to start ESG accounting" : c ? c.canonical_unit : undefined}
        loading={carbon.isLoading}
        unavailableHint="Carbon dashboard unavailable"
      />
    </div>
  );
}
