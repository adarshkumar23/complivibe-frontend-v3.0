"use client";

import { CreditCard } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import type { BillingData } from "@/lib/hooks/useBilling";

/** Plans from GET /api/v1/billing/plans; current plan from /billing/status. */
export function PlanComparison({ data }: { data: BillingData }) {
  const { plans, status } = data;
  const list = plans.data ?? [];
  const current = status.data?.plan;

  return (
    <SectionCard
      title="Plans"
      subtitle="Available subscription tiers"
      icon={CreditCard}
      accent="blue"
      className="h-full"
    >
      {plans.isLoading ? (
        <SkeletonRows rows={4} />
      ) : plans.isError ? (
        <ErrorState title="Unable to load plans" onRetry={() => plans.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon={CreditCard} title="No plans available" description="Subscription plans will list here." />
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {list.map((p) => (
            <div key={p.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-bold text-cv-ink">{p.display_name}</p>
                {current === p.plan_code ? <StatusBadge label="Current" tone="good" /> : null}
              </div>
              <p className="mt-0.5 text-[11px] text-cv-slate">
                {p.plan_type === "usage_based"
                  ? `₹${p.usage_unit_price_inr ?? 0}/unit usage-based`
                  : `₹${p.price_inr_monthly}/mo · ₹${p.price_inr_annual}/yr`}
              </p>
              <p className="mt-1 text-[11px] text-cv-slate">
                {[
                  p.max_users != null ? `${p.max_users} users` : "unlimited users",
                  p.max_frameworks != null ? `${p.max_frameworks} frameworks` : "unlimited frameworks",
                  p.max_ai_systems != null ? `${p.max_ai_systems} AI systems` : "unlimited AI systems"
                ].join(" · ")}
              </p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
