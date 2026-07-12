"use client";

import { ShieldOff } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import type { EvidenceData } from "@/lib/hooks/useEvidence";

/** Controls lacking evidence, from GET /api/v1/evidence/readiness/gaps. */
export function EvidenceFreshnessPanel({ data }: { data: EvidenceData }) {
  const { gaps } = data;
  const list = (gaps.data ?? []).slice(0, 8);

  return (
    <SectionCard title="Readiness Gaps" subtitle="Controls an auditor would flag today" icon={ShieldOff} accent="amber">
      {gaps.isLoading ? (
        <SkeletonRows rows={4} />
      ) : gaps.isError ? (
        <ErrorState compact title="Unable to load gaps" onRetry={() => gaps.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState compact icon={ShieldOff} title="No readiness gaps" description="Every control has current evidence." />
      ) : (
        <ul className="space-y-2.5">
          {list.map((g, i) => (
            <li key={(g.control_id as string) ?? i} className="rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <p className="text-[13px] font-semibold leading-snug text-cv-ink">
                {(g.control_name as string) ?? (g.control_id as string) ?? "Control"}
              </p>
              {g.reason ? (
                <p className="mt-0.5 text-[11px] text-cv-slate">{String(g.reason).replaceAll("_", " ")}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
