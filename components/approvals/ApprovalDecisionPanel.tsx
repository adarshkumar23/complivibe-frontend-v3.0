"use client";

import { History, Link2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeApprovals, decisionHistory, statusTone } from "@/lib/api/approval-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { ApprovalsData } from "@/lib/hooks/useApprovals";

export function ApprovalDecisionPanel({ data }: { data: ApprovalsData }) {
  const { approvals } = data;
  const history = decisionHistory(normalizeApprovals(approvals.data));

  return (
    <SectionCard title="Decision History" subtitle="Recorded approval decisions" icon={History} accent="cyan" className="h-full">
      {approvals.isLoading ? (
        <SkeletonRows rows={4} />
      ) : approvals.isError ? (
        <ErrorState compact title="Unable to load decisions" onRetry={() => approvals.refetch()} />
      ) : history.length === 0 ? (
        <EmptyState icon={History} title="Decision history unavailable from backend." description="Reviewer decisions, comments, and timestamps will appear here once the backend records them." />
      ) : (
        <ul className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
          {history.slice(0, 12).map((d) => (
            <li key={`${d.id}-${d.timestamp}`} className="rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 truncate text-[13px] font-semibold text-cv-ink">{d.title}</p>
                {d.decision ? <StatusBadge label={d.decision} tone={statusTone(d.decision)} /> : null}
              </div>
              <p className="mt-0.5 text-[11px] text-cv-slate">
                {[d.reviewer, formatRelativeTime(d.timestamp)].filter(Boolean).join(" · ")}
              </p>
              {d.comment ? <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-cv-slate">{d.comment}</p> : null}
              {d.linkedResource ? (
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-cv-blue"><Link2 size={11} /> {d.linkedResource}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
