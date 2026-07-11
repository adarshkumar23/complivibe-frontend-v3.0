"use client";

import { ListChecks } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AuditPackData } from "@/lib/hooks/useAuditPack";

/** PBC pipeline from GET /api/v1/compliance/pbc-items/summary. */
export function ReadinessChecklist({ data }: { data: AuditPackData }) {
  const { pbc } = data;
  const p = pbc.data;

  const rows = p ? Object.entries(p.by_status).map(([status, count]) => ({ status, count })) : [];

  return (
    <SectionCard title="PBC Pipeline" subtitle="Provided-by-client request status" icon={ListChecks} accent="purple">
      {pbc.isLoading ? (
        <SkeletonRows rows={4} />
      ) : pbc.isError ? (
        <ErrorState compact title="Unable to load PBC summary" onRetry={() => pbc.refetch()} />
      ) : (
        <ul className="space-y-2.5">
          {rows.map((r) => (
            <li key={r.status} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <span className="text-[13px] font-semibold text-cv-ink">{r.status.replaceAll("_", " ")}</span>
              <StatusBadge
                label={String(r.count)}
                tone={r.status === "overdue" && r.count > 0 ? "bad" : r.status === "accepted" ? "good" : "neutral"}
              />
            </li>
          ))}
          {p && p.items_without_evidence > 0 ? (
            <p className="pt-1 text-[11px] font-medium text-amber-600">
              {p.items_without_evidence} submitted item{p.items_without_evidence === 1 ? "" : "s"} lack linked evidence.
            </p>
          ) : null}
        </ul>
      )}
    </SectionCard>
  );
}
