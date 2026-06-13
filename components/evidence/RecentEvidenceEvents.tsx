"use client";

import { History, Activity } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeEvidenceItems, evidenceEvents } from "@/lib/api/evidence-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { EvidenceData } from "@/lib/hooks/useEvidence";

export function RecentEvidenceEvents({ data }: { data: EvidenceData }) {
  const { evidence } = data;
  const items = normalizeEvidenceItems(evidence.data);
  const events = evidenceEvents(items).slice(0, 6);

  return (
    <SectionCard title="Recent Evidence Events" subtitle="Latest uploads & updates" icon={History} accent="cyan" className="h-full">
      {evidence.isLoading ? (
        <SkeletonRows rows={4} />
      ) : evidence.isError ? (
        <ErrorState compact title="Unable to load events" onRetry={() => evidence.refetch()} />
      ) : events.length === 0 ? (
        <EmptyState
          compact
          icon={Activity}
          title="No dated evidence"
          description="Upload or update events appear here when evidence records include timestamps."
        />
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
                  {[e.type, formatRelativeTime(e.timestamp)].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
