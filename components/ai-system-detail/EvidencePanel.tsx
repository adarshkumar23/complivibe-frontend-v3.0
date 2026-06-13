"use client";

import { FolderCheck, FolderOpen } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeDetailEvidence } from "@/lib/api/ai-system-detail-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { AiSystemDetail } from "@/lib/hooks/useAiSystemDetail";

function statusTone(status: string | null): "good" | "warn" | "bad" | "neutral" {
  const s = (status || "").toLowerCase();
  if (["fresh", "valid", "approved", "current"].some((x) => s.includes(x))) return "good";
  if (["stale", "pending", "review"].some((x) => s.includes(x))) return "warn";
  if (["expired", "missing", "rejected"].some((x) => s.includes(x))) return "bad";
  return "neutral";
}

export function EvidencePanel({ data }: { data: AiSystemDetail }) {
  const { evidence } = data;
  const items = normalizeDetailEvidence(evidence.data);

  return (
    <SectionCard
      title="Evidence"
      subtitle="Linked governance evidence"
      icon={FolderCheck}
      accent="green"
      className="h-full"
      action={
        evidence.isSuccess && items.length > 0 ? (
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 ring-1 ring-emerald-500/20">
            {items.length}
          </span>
        ) : null
      }
    >
      {evidence.isLoading ? (
        <SkeletonRows rows={4} />
      ) : evidence.isError ? (
        <ErrorState title="Unable to load evidence" onRetry={() => evidence.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No evidence linked"
          description="Evidence files linked to this system will appear here with type, status, and date."
        />
      ) : (
        <ul className="max-h-[320px] space-y-2.5 overflow-y-auto pr-1">
          {items.slice(0, 8).map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{e.title}</p>
                <p className="truncate text-[11px] text-cv-slate">
                  {[e.type, formatDate(e.date)].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
              {e.status ? <StatusBadge label={e.status} tone={statusTone(e.status)} /> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
