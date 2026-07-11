"use client";

import { Leaf } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import type { BillingData } from "@/lib/hooks/useBilling";

/** Emissions by scope from GET /api/v1/carbon-accounting/dashboard. */
export function CarbonPanel({ data }: { data: BillingData }) {
  const { carbon } = data;
  const c = carbon.data;
  const scopes = c ? Object.entries(c.totals_by_scope) : [];

  return (
    <SectionCard title="Carbon Accounting" subtitle="Emissions by scope (ESG)" icon={Leaf} accent="green">
      {carbon.isLoading ? (
        <SkeletonRows rows={3} />
      ) : carbon.isError ? (
        <ErrorState compact title="Unable to load carbon data" onRetry={() => carbon.refetch()} />
      ) : scopes.length === 0 ? (
        <EmptyState
          compact
          icon={Leaf}
          title="No emissions readings"
          description="Submit readings via the carbon API to build scope 1/2/3 totals."
        />
      ) : (
        <ul className="space-y-2.5">
          {scopes.map(([scope, total]) => (
            <li key={scope} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <span className="text-[13px] font-semibold text-cv-ink">{scope.replaceAll("_", " ")}</span>
              <span className="text-[12px] font-bold text-cv-slate">
                {total} {c?.canonical_unit}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
