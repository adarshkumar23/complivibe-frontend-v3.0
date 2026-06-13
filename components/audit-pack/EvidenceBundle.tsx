"use client";

import { FileCheck2, FolderOpen } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeEvidenceItems, evidenceFreshness, type FreshnessState } from "@/lib/api/evidence-normalizers";
import type { AuditPackData } from "@/lib/hooks/useAuditPack";

const freshnessTone: Record<FreshnessState, "good" | "warn" | "bad" | "neutral"> = {
  fresh: "good",
  expiring: "warn",
  expired: "bad",
  unknown: "neutral"
};
const freshnessLabel: Record<FreshnessState, string> = { fresh: "Fresh", expiring: "Expiring", expired: "Expired", unknown: "" };

export function EvidenceBundle({ data }: { data: AuditPackData }) {
  const { evidence } = data;
  const items = normalizeEvidenceItems(evidence.data);

  return (
    <SectionCard title="Evidence Bundle" subtitle="Evidence ready to include" icon={FileCheck2} accent="green">
      {evidence.isLoading ? (
        <SkeletonRows rows={4} />
      ) : evidence.isError ? (
        <ErrorState compact title="Unable to load evidence" onRetry={() => evidence.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState compact icon={FolderOpen} title="No evidence to bundle" description="Evidence records will appear here once available in the vault." />
      ) : (
        <ul className="max-h-[320px] space-y-2.5 overflow-y-auto pr-1">
          {items.slice(0, 8).map((e) => {
            const state = evidenceFreshness(e);
            return (
              <li key={e.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-cv-ink">{e.title}</p>
                  <p className="truncate text-[11px] text-cv-slate">
                    {[e.type, e.control || e.framework].filter(Boolean).join(" · ") || "No type / control"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {e.status ? <StatusBadge label={e.status} tone="info" /> : null}
                  {state !== "unknown" ? <StatusBadge label={freshnessLabel[state]} tone={freshnessTone[state]} /> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
