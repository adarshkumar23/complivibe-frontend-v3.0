"use client";

import { PieChart } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeApprovals, workflowDistribution } from "@/lib/api/approval-normalizers";
import type { ApprovalsData } from "@/lib/hooks/useApprovals";

const toneBar = { good: "bg-emerald-500", warn: "bg-amber-500", bad: "bg-rose-500", neutral: "bg-slate-400" } as const;

export function WorkflowDistribution({ data }: { data: ApprovalsData }) {
  const { approvals } = data;
  const buckets = workflowDistribution(normalizeApprovals(approvals.data));
  const total = buckets.reduce((s, b) => s + b.value, 0);

  return (
    <SectionCard title="Workflow Distribution" subtitle="Approvals by decision state" icon={PieChart} accent="purple" className="h-full">
      {approvals.isLoading ? (
        <SkeletonRows rows={4} />
      ) : approvals.isError ? (
        <ErrorState compact title="Unable to load workflow" onRetry={() => approvals.refetch()} />
      ) : buckets.length === 0 ? (
        <EmptyState icon={PieChart} title="Workflow distribution unavailable" description="Approval state counts will appear here once the backend returns approval statuses." />
      ) : (
        <ul className="space-y-3">
          {buckets.map((b) => (
            <li key={b.label}>
              <div className="mb-1.5 flex items-center justify-between text-[13px]">
                <span className="font-semibold text-cv-ink">{b.label}</span>
                <span className="font-bold text-cv-ink">{b.value}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-400/12">
                <div className={`h-full rounded-full ${toneBar[b.tone]}`} style={{ width: `${total > 0 ? Math.max(4, (b.value / total) * 100) : 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
