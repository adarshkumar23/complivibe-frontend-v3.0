"use client";

import { Layers, LayoutGrid } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeFrameworks, normalizeObligations } from "@/lib/api/compliance-normalizers";
import type { PoliciesData } from "@/lib/hooks/usePolicies";

export function PolicyFrameworkMapping({ data }: { data: PoliciesData }) {
  const { frameworks, obligations } = data;
  const fws = normalizeFrameworks(frameworks.data);

  // Real obligation→framework counts from backend obligation records.
  const obligationCounts = new Map<string, number>();
  for (const o of normalizeObligations(obligations.data)) {
    if (!o.framework) continue;
    obligationCounts.set(o.framework, (obligationCounts.get(o.framework) ?? 0) + 1);
  }

  const loading = frameworks.isLoading && obligations.isLoading;
  const errored = frameworks.isError && obligations.isError;

  return (
    <SectionCard title="Framework Mapping" subtitle="Regulatory frameworks & mapped obligations" icon={LayoutGrid} accent="purple" className="h-full">
      {loading ? (
        <SkeletonRows rows={5} />
      ) : errored ? (
        <ErrorState compact title="Unable to load mapping" onRetry={() => frameworks.refetch()} />
      ) : fws.length === 0 ? (
        <EmptyState icon={Layers} title="Policy-to-framework mapping unavailable from backend." description="Frameworks and their mapped obligations will appear here once the backend returns them." />
      ) : (
        <ul className="max-h-[360px] space-y-2.5 overflow-y-auto pr-1">
          {fws.slice(0, 10).map((f) => {
            const obCount = obligationCounts.get(f.name) ?? null;
            return (
              <li key={f.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-cv-ink">{f.name}</p>
                  <p className="truncate text-[11px] text-cv-slate">
                    {[obCount != null ? `${obCount} obligations` : null, f.controlsTotal != null ? `${f.controlsTotal} controls` : null].filter(Boolean).join(" · ") || "No mapping detail"}
                  </p>
                </div>
                {f.coverage != null ? <StatusBadge label={`${Math.round(f.coverage)}%`} tone="info" /> : f.status ? <StatusBadge label={f.status} tone="neutral" /> : null}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
