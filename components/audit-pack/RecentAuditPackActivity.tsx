"use client";

import { History, Activity } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeAuditPacks, auditPackActivity } from "@/lib/api/audit-pack-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { AuditPackData } from "@/lib/hooks/useAuditPack";

export function RecentAuditPackActivity({ data }: { data: AuditPackData }) {
  const { packs } = data;
  const list = normalizeAuditPacks(packs.data);
  const events = auditPackActivity(list).slice(0, 6);

  return (
    <SectionCard title="Recent Audit Pack Activity" subtitle="Latest generations & exports" icon={History} accent="cyan" className="h-full">
      {packs.isLoading ? (
        <SkeletonRows rows={4} />
      ) : packs.isError ? (
        <ErrorState compact title="Unable to load activity" onRetry={() => packs.refetch()} />
      ) : events.length === 0 ? (
        <EmptyState compact icon={Activity} title="No dated pack activity" description="Audit pack generation and export events appear here when records include timestamps." />
      ) : (
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={`${e.id}-${e.timestamp}`} className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cv-brand" />
              <div className="min-w-0">
                <p className="line-clamp-2 text-[13px] font-medium text-cv-ink">
                  <span className="font-semibold">{e.action}:</span> {e.title}
                </p>
                <p className="text-[11px] text-cv-mist">
                  {[e.status, formatRelativeTime(e.timestamp)].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
