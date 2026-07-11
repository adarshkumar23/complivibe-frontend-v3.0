"use client";

import { ListChecks, CheckCircle2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import type { Severity } from "@/lib/api/types";
import type { Compliance } from "@/lib/hooks/useCompliance";

const CLOSED = new Set(["resolved", "closed"]);

/** Open compliance issues from GET /api/v1/compliance/issues. */
export function OpenObligations({ data }: { data: Compliance }) {
  const { issues } = data;
  const open = (issues.data ?? []).filter((i) => !CLOSED.has(i.status));
  const shown = open.slice(0, 5);

  return (
    <SectionCard
      title="Open Issues"
      subtitle="Compliance issues awaiting resolution"
      icon={ListChecks}
      accent="amber"
      action={
        open.length > 0 ? (
          <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-bold text-amber-600 ring-1 ring-amber-400/25">
            {open.length}
          </span>
        ) : null
      }
    >
      {issues.isLoading ? (
        <SkeletonRows rows={4} />
      ) : issues.isError ? (
        <ErrorState compact title="Unable to load issues" onRetry={() => issues.refetch()} />
      ) : shown.length === 0 ? (
        <EmptyState
          compact
          icon={CheckCircle2}
          title="No open issues"
          description="All tracked compliance issues are resolved, or none have been raised yet."
        />
      ) : (
        <ul className="space-y-2.5">
          {shown.map((issue) => (
            <li key={issue.id} className="rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="flex items-start justify-between gap-3">
                <p className="line-clamp-1 text-[13px] font-semibold text-cv-ink">{issue.title}</p>
                <SeverityBadge severity={issue.severity as Severity} />
              </div>
              <p className="mt-0.5 text-[11px] text-cv-slate">
                {issue.issue_type.replaceAll("_", " ")}
                {issue.assigned_to ? "" : " · unassigned"}
                {issue.status !== "open" ? ` · ${issue.status.replaceAll("_", " ")}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
      {!issues.isLoading && !issues.isError && open.length > 0 && shown.length < open.length ? (
        <p className="mt-3 text-[11px] font-medium text-cv-mist">
          Showing {shown.length} of {open.length} open issues
        </p>
      ) : null}
    </SectionCard>
  );
}
