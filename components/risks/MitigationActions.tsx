"use client";

import { Wrench, ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeRisks } from "@/lib/api/risk-normalizers";
import type { RisksData } from "@/lib/hooks/useRisks";

export function MitigationActions({ data }: { data: RisksData }) {
  const { risks } = data;
  const list = normalizeRisks(risks.data);
  const withMitigation = list.filter((r) => r.mitigation).slice(0, 6);
  const anyRisks = list.length > 0;

  return (
    <SectionCard title="Mitigation Actions" subtitle="Remediation from the register" icon={Wrench} accent="teal" className="h-full">
      {risks.isLoading ? (
        <SkeletonRows rows={4} />
      ) : risks.isError ? (
        <ErrorState compact title="Unable to load mitigations" onRetry={() => risks.refetch()} />
      ) : !anyRisks ? (
        <EmptyState compact icon={ShieldCheck} title="No risks recorded" description="Mitigation actions appear here once risks are registered." />
      ) : withMitigation.length === 0 ? (
        <EmptyState compact icon={Wrench} title="No mitigation action returned by backend" description="Risks exist but none include a mitigation or remediation field." />
      ) : (
        <ul className="space-y-2.5">
          {withMitigation.map((r) => (
            <li key={r.id} className="rounded-2xl bg-white/55 p-3.5 ring-1 ring-white/70">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-semibold leading-snug text-cv-ink">{r.title}</p>
                {r.hasSeverity ? <SeverityBadge severity={r.severity} /> : null}
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-cv-slate">{r.mitigation}</p>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
