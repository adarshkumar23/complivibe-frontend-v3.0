"use client";

import { useState } from "react";
import { AlertOctagon, ArrowRight, Loader2, Plus, ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { IssueCreateModal } from "@/components/incidents/IssueCreateModal";
import { IssueResolutionNoteModal } from "@/components/incidents/IssueResolutionNoteModal";
import { ISSUE_ALLOWED_NEXT_STATUS, type Issue } from "@/lib/api/compliance";
import { ApiError } from "@/lib/api/client";
import { useAssignIssue, useTransitionIssue, type IncidentsPageData } from "@/lib/hooks/useIncidentsPage";
import type { Severity } from "@/lib/api/types";
import type { OrgUser } from "@/lib/api/users";

function statusTone(status: string): "good" | "warn" | "bad" | "info" | "neutral" {
  if (status === "closed") return "neutral";
  if (status === "resolved") return "good";
  if (status === "mitigating") return "info";
  if (status === "investigating") return "warn";
  return "bad"; // open
}

const KNOWN_SEVERITIES = new Set(["critical", "high", "medium", "low", "info"]);
function asSeverity(s: string): Severity {
  return (KNOWN_SEVERITIES.has(s) ? s : "info") as Severity;
}

function prettify(v: string) {
  return v.replaceAll("_", " ");
}

function IssueActions({
  issue,
  users,
  onRequestClose
}: {
  issue: Issue;
  users: OrgUser[];
  onRequestClose: (issue: Issue) => void;
}) {
  const transition = useTransitionIssue();
  const assign = useAssignIssue();
  const [assignee, setAssignee] = useState(issue.assigned_to ?? "");
  const [rowError, setRowError] = useState<string | null>(null);

  const activeUsers = users.filter((u) => u.is_active && u.status === "active");
  const nextStatus = ISSUE_ALLOWED_NEXT_STATUS[issue.status] ?? null;

  const advance = async () => {
    if (!nextStatus) return;
    setRowError(null);
    if (issue.status === "resolved" && nextStatus === "closed") {
      onRequestClose(issue);
      return;
    }
    try {
      await transition.mutateAsync({ id: issue.id, newStatus: nextStatus });
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : "Transition failed — the backend may be unavailable.");
    }
  };

  const doAssign = async () => {
    if (!assignee) return;
    setRowError(null);
    try {
      await assign.mutateAsync({ id: issue.id, assignedTo: assignee });
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : "Assign failed — the backend may be unavailable.");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {nextStatus ? (
        <button
          type="button"
          onClick={advance}
          disabled={transition.isPending}
          className="cv-ring-focus inline-flex w-fit items-center gap-1.5 rounded-full bg-cv-brand/10 px-2.5 py-1 text-[11px] font-bold text-cv-brand ring-1 ring-cv-brand/25 transition hover:bg-cv-brand/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {transition.isPending ? <Loader2 size={11} className="animate-spin" /> : <ArrowRight size={11} />}
          Move to {prettify(nextStatus)}
        </button>
      ) : (
        <StatusBadge label="Closed — terminal" tone="neutral" />
      )}

      <div className="flex items-center gap-1.5">
        <select
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          aria-label={`Assignee for ${issue.title}`}
          className="cv-ring-focus rounded-lg bg-white/50 px-2 py-1 text-[11px] text-cv-ink ring-1 ring-white/60 focus:outline-none"
        >
          <option value="">Unassigned</option>
          {activeUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name || u.email}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={doAssign}
          disabled={assign.isPending || !assignee || assignee === issue.assigned_to}
          className="cv-ring-focus inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-1 text-[11px] font-bold text-cv-slate ring-1 ring-white/70 transition hover:bg-white hover:text-cv-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          {assign.isPending ? <Loader2 size={11} className="animate-spin" /> : null}
          Assign
        </button>
      </div>

      {rowError ? <p className="max-w-xs text-[11px] font-semibold text-rose-600">{rowError}</p> : null}
    </div>
  );
}

export function IssuesTable({ data }: { data: IncidentsPageData }) {
  const { issues, users } = data;
  const [modalOpen, setModalOpen] = useState(false);
  const [closingIssue, setClosingIssue] = useState<Issue | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const rows = (issues.data ?? []).filter((i) => statusFilter === "all" || i.status === statusFilter);

  return (
    <SectionCard
      title="Compliance Issues"
      subtitle="Governance issue register with SLA + RCA tracking — app/api/v1/issues.py"
      icon={AlertOctagon}
      accent="amber"
      action={
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by issue status"
            className="cv-ring-focus rounded-full bg-white/60 px-3 py-1.5 text-[11px] font-semibold text-cv-ink ring-1 ring-white/70 focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="mitigating">Mitigating</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-4 py-2 text-xs font-bold text-white shadow-button transition hover:-translate-y-0.5"
          >
            <Plus size={14} strokeWidth={2.6} />
            Open issue
          </button>
        </div>
      }
    >
      {issues.isLoading ? (
        <SkeletonRows rows={3} />
      ) : issues.isError ? (
        <ErrorState
          title="Issues could not load"
          description={issues.error instanceof Error ? issues.error.message : undefined}
          onRetry={() => issues.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={(issues.data ?? []).length === 0 ? "No compliance issues recorded" : "No issues match this filter"}
          description={
            (issues.data ?? []).length === 0
              ? "The live issues endpoint returned zero rows for this organization."
              : "Try a different status filter."
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-wide text-cv-mist">
                <th className="pb-2.5 pr-3">Issue</th>
                <th className="pb-2.5 pr-3">Severity</th>
                <th className="pb-2.5 pr-3">Status</th>
                <th className="pb-2.5 pr-3">Type</th>
                <th className="pb-2.5 pr-3">SLA</th>
                <th className="pb-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/50">
              {rows.map((issue) => (
                <tr key={issue.id} className="align-top">
                  <td className="py-3 pr-3">
                    <p className="max-w-[220px] font-semibold text-cv-ink">{issue.title}</p>
                    <p className="mt-0.5 max-w-[220px] text-[11px] text-cv-slate">{issue.description}</p>
                    <p className="mt-0.5 text-[10px] font-semibold text-cv-mist">{issue.source_type ?? "manual"} source</p>
                  </td>
                  <td className="py-3 pr-3">
                    <SeverityBadge severity={asSeverity(issue.severity)} />
                  </td>
                  <td className="py-3 pr-3">
                    <StatusBadge label={issue.status} tone={statusTone(issue.status)} />
                  </td>
                  <td className="py-3 pr-3 text-xs font-medium text-cv-slate">{issue.issue_type.replace(/_/g, " ")}</td>
                  <td className="py-3 pr-3">
                    {issue.insight ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold text-cv-slate">{Math.round(issue.insight.hours_open)}h open</span>
                        {issue.insight.resolution_breached ? (
                          <StatusBadge label="SLA breached" tone="bad" />
                        ) : issue.insight.response_breached ? (
                          <StatusBadge label="Response SLA breached" tone="warn" />
                        ) : (
                          <StatusBadge label="Within SLA" tone="good" />
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-cv-mist">—</span>
                    )}
                  </td>
                  <td className="py-3">
                    <IssueActions issue={issue} users={users.data ?? []} onRequestClose={setClosingIssue} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <IssueCreateModal open={modalOpen} onClose={() => setModalOpen(false)} users={users.data ?? []} />
      <IssueResolutionNoteModal
        open={closingIssue != null}
        onClose={() => setClosingIssue(null)}
        issueId={closingIssue?.id ?? null}
        issueTitle={closingIssue?.title ?? ""}
      />
    </SectionCard>
  );
}
