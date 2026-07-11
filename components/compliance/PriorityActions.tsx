"use client";

import { Target, CheckCircle2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import type { Severity } from "@/lib/api/types";
import type { Compliance } from "@/lib/hooks/useCompliance";

type Action = {
  id: string;
  title: string;
  reason: string;
  severity: Severity;
  rank: number;
};

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

/**
 * Ranked worklist assembled from real backend signals only:
 * open issues (by severity), overdue deadlines (by priority + how overdue),
 * and control-health gaps. No synthetic entries.
 */
function buildActions(data: Compliance): Action[] {
  const actions: Action[] = [];

  for (const issue of data.issues.data ?? []) {
    if (issue.status === "resolved" || issue.status === "closed") continue;
    const sev = (issue.severity || "medium") as Severity;
    actions.push({
      id: `issue-${issue.id}`,
      title: issue.title,
      reason: `Open ${issue.issue_type.replaceAll("_", " ")}${issue.assigned_to ? "" : " · unassigned"}`,
      severity: sev,
      rank: (SEV_ORDER[sev] ?? 3) * 10
    });
  }

  for (const d of data.deadlines.data ?? []) {
    if (d.status !== "upcoming" && d.status !== "overdue") continue;
    const days = d.days_until_due;
    if (days == null || days > 14) continue;
    const overdue = days < 0;
    actions.push({
      id: `deadline-${d.id}`,
      title: d.title,
      reason: overdue
        ? `${d.deadline_type.replaceAll("_", " ")} overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`
        : `${d.deadline_type.replaceAll("_", " ")} due in ${days} day${days === 1 ? "" : "s"}`,
      severity: overdue ? "critical" : d.priority === "critical" || d.priority === "high" ? "high" : "medium",
      rank: overdue ? -5 + (SEV_ORDER[d.priority] ?? 2) : 5 + days
    });
  }

  const ch = data.controlHealth.data;
  if (ch && ch.controls_with_no_evidence > 0) {
    actions.push({
      id: "ch-no-evidence",
      title: `${ch.controls_with_no_evidence} controls have no supporting evidence`,
      reason: "Auditors will treat these controls as unproven",
      severity: "high",
      rank: 8
    });
  }
  if (ch && ch.controls_with_expired_evidence > 0) {
    actions.push({
      id: "ch-expired-evidence",
      title: `${ch.controls_with_expired_evidence} controls rely on expired evidence`,
      reason: "Refresh evidence to keep these controls audit-ready",
      severity: "medium",
      rank: 12
    });
  }

  return actions.sort((a, b) => a.rank - b.rank);
}

export function PriorityActions({ data }: { data: Compliance }) {
  const { issues, deadlines, controlHealth } = data;
  const loading = issues.isLoading || deadlines.isLoading || controlHealth.isLoading;
  const errored = issues.isError && deadlines.isError && controlHealth.isError;
  const actions = buildActions(data).slice(0, 6);

  return (
    <SectionCard
      title="Priority Actions"
      subtitle="What to fix next, ranked by real urgency"
      icon={Target}
      accent="red"
      className="h-full"
    >
      {loading ? (
        <SkeletonRows rows={4} />
      ) : errored ? (
        <ErrorState
          title="Unable to load priority actions"
          onRetry={() => {
            issues.refetch();
            deadlines.refetch();
            controlHealth.refetch();
          }}
        />
      ) : actions.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Nothing urgent"
          description="No open issues, imminent deadlines, or control-health gaps right now."
        />
      ) : (
        <ul className="space-y-2.5">
          {actions.map((action) => (
            <li key={action.id} className="rounded-2xl bg-white/55 p-3.5 ring-1 ring-white/70 transition hover:bg-white/80">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-semibold leading-snug text-cv-ink">{action.title}</p>
                <SeverityBadge severity={action.severity} />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-cv-slate">{action.reason}</p>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
