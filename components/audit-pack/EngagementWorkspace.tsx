"use client";

import { useState } from "react";
import { ArrowRight, ClipboardList, ClipboardPlus, FilePlus2, Loader2, TriangleAlert } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { formatDate } from "@/lib/utils/format";
import { useHasPermission } from "@/lib/hooks/usePermissions";
import {
  ENGAGEMENT_NEXT_STATUSES,
  FINDING_NEXT_STATUSES,
  type AuditEngagement,
  type PbcItem
} from "@/lib/api/audit-pack";
import type { Severity } from "@/lib/api/types";
import {
  useEngagementFindings,
  useEngagementPbcItems,
  useTransitionEngagement,
  useTransitionFinding
} from "@/lib/hooks/useAuditPack";
import { FindingCreateModal } from "@/components/audit-pack/FindingCreateModal";
import { PbcItemCreateModal } from "@/components/audit-pack/PbcItemCreateModal";
import { PbcActionModal, type PbcAction } from "@/components/audit-pack/PbcActionModal";

function toSeverity(value: string): Severity {
  if (value === "informational") return "info";
  if (value === "critical" || value === "high" || value === "medium" || value === "low") return value;
  return "info";
}

function findingTone(status: string): "good" | "warn" | "bad" | "info" | "neutral" {
  if (status === "closed" || status === "remediated" || status === "resolved") return "good";
  if (status === "in_remediation" || status === "remediation_in_progress") return "info";
  if (status === "accepted_risk" || status === "risk_accepted") return "warn";
  if (status === "open") return "bad";
  return "neutral";
}

function pbcTone(status: string): "good" | "warn" | "bad" | "info" | "neutral" {
  if (status === "accepted") return "good";
  if (status === "submitted") return "info";
  if (status === "rejected" || status === "overdue") return "bad";
  return "neutral";
}

const PBC_ACTIONS: Record<string, PbcAction[]> = {
  pending: ["submit", "reject"],
  submitted: ["accept", "reject"],
  overdue: ["submit"],
  rejected: [],
  accepted: []
};

const transitionBtn =
  "cv-ring-focus inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60";

const addBtn =
  "cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-3 py-1.5 text-[11px] font-bold text-white shadow-button transition hover:-translate-y-0.5";

/**
 * Working surface for one engagement: findings register
 * (GET /audit-findings/engagement/{id}) and PBC tracker
 * (GET /pbc-items/engagement/{id}), with create + transition actions.
 */
export function EngagementWorkspace({ engagement }: { engagement: AuditEngagement }) {
  const findings = useEngagementFindings(engagement.id);
  const pbcItems = useEngagementPbcItems(engagement.id);
  const transitionEngagement = useTransitionEngagement();
  const transitionFinding = useTransitionFinding(engagement.id);

  const [findingModalOpen, setFindingModalOpen] = useState(false);
  const [pbcModalOpen, setPbcModalOpen] = useState(false);
  const [pbcTarget, setPbcTarget] = useState<{ item: PbcItem; action: PbcAction } | null>(null);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  // Gate all audit-pack mutations (create + transition PBC/findings/engagement)
  // on audit:write (mirrors risks gating); backend enforces the same, so an
  // ungated action would 403.
  const canWriteAudit = useHasPermission("audit:write");

  const engagementStatus = String(engagement.status ?? "planning");
  const nextEngagementStatuses = ENGAGEMENT_NEXT_STATUSES[engagementStatus] ?? [];
  const findingList = findings.data ?? [];
  const pbcList = pbcItems.data ?? [];
  const title = String(engagement.title ?? "Engagement");

  function moveEngagement(newStatus: string) {
    setTransitionError(null);
    transitionEngagement.mutate(
      { engagementId: engagement.id, newStatus },
      { onError: (e) => setTransitionError(e instanceof Error ? e.message : "Transition failed.") }
    );
  }

  function moveFinding(findingId: string, newStatus: string) {
    setTransitionError(null);
    transitionFinding.mutate(
      { findingId, newStatus },
      { onError: (e) => setTransitionError(e instanceof Error ? e.message : "Transition failed.") }
    );
  }

  return (
    <div className="space-y-4" data-testid="engagement-workspace">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/55 px-4 py-3 ring-1 ring-white/70">
        <div className="min-w-0">
          <p className="text-[14px] font-bold leading-snug text-cv-ink">{title}</p>
          <p className="mt-0.5 text-[11px] text-cv-slate">
            {[
              engagement.audit_type ? String(engagement.audit_type).replaceAll("_", " ") : null,
              engagement.start_date && engagement.end_date
                ? `${formatDate(String(engagement.start_date)) ?? engagement.start_date} → ${formatDate(String(engagement.end_date)) ?? engagement.end_date}`
                : null,
              engagement.audit_firm ? String(engagement.audit_firm) : null
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={engagementStatus.replaceAll("_", " ")} tone={engagementStatus === "closed" ? "good" : engagementStatus === "cancelled" ? "neutral" : "info"} />
          {canWriteAudit
            ? nextEngagementStatuses.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => moveEngagement(s)}
                  disabled={transitionEngagement.isPending}
                  className={transitionBtn}
                  data-testid={`engagement-transition-${s}`}
                >
                  {transitionEngagement.isPending ? <Loader2 size={11} className="animate-spin" /> : <ArrowRight size={11} />}
                  {s.replaceAll("_", " ")}
                </button>
              ))
            : null}
        </div>
      </div>

      {transitionError ? (
        <p className="rounded-2xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">
          {transitionError}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard
          title="Findings"
          subtitle="Nonconformities and observations for this engagement"
          icon={TriangleAlert}
          accent="red"
          className="h-full"
          action={
            canWriteAudit ? (
              <button type="button" onClick={() => setFindingModalOpen(true)} className={addBtn} data-testid="open-finding-modal">
                <FilePlus2 size={12} />
                New finding
              </button>
            ) : null
          }
        >
          {findings.isLoading ? (
            <SkeletonRows rows={3} />
          ) : findings.isError ? (
            <ErrorState compact title="Unable to load findings" onRetry={() => findings.refetch()} />
          ) : findingList.length === 0 ? (
            <EmptyState
              compact
              icon={TriangleAlert}
              title="No findings recorded"
              description="Record what the auditor observed, who owns remediation, and the target date."
            />
          ) : (
            <ul className="space-y-2.5">
              {findingList.map((f) => {
                const nexts = FINDING_NEXT_STATUSES[f.status] ?? [];
                return (
                  <li key={f.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold leading-snug text-cv-ink">
                          {f.finding_ref ? <span className="mr-1.5 text-cv-slate">{f.finding_ref}</span> : null}
                          {f.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-cv-slate">
                          {[
                            f.framework_ref,
                            f.target_remediation_date
                              ? `target ${formatDate(f.target_remediation_date) ?? f.target_remediation_date}`
                              : null
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <SeverityBadge severity={toSeverity(f.severity)} />
                        <StatusBadge label={f.status.replaceAll("_", " ")} tone={findingTone(f.status)} />
                      </div>
                    </div>
                    {canWriteAudit && nexts.length > 0 ? (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-white/60 pt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-cv-mist">Move to</span>
                        {nexts.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => moveFinding(f.id, s)}
                            disabled={transitionFinding.isPending}
                            className={transitionBtn}
                            data-testid={`finding-transition-${s}`}
                          >
                            <ArrowRight size={11} />
                            {s.replaceAll("_", " ")}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="PBC Items"
          subtitle="Provided-by-client requests for this engagement"
          icon={ClipboardList}
          accent="purple"
          className="h-full"
          action={
            canWriteAudit ? (
              <button type="button" onClick={() => setPbcModalOpen(true)} className={addBtn} data-testid="open-pbc-modal">
                <ClipboardPlus size={12} />
                New request
              </button>
            ) : null
          }
        >
          {pbcItems.isLoading ? (
            <SkeletonRows rows={3} />
          ) : pbcItems.isError ? (
            <ErrorState compact title="Unable to load PBC items" onRetry={() => pbcItems.refetch()} />
          ) : pbcList.length === 0 ? (
            <EmptyState
              compact
              icon={ClipboardList}
              title="No PBC requests"
              description="Request the documents the auditor needs, then track them to acceptance."
            />
          ) : (
            <ul className="space-y-2.5">
              {pbcList.map((item) => {
                const actions = PBC_ACTIONS[item.status] ?? [];
                return (
                  <li key={item.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold leading-snug text-cv-ink">{item.title}</p>
                        <p className="mt-0.5 text-[11px] text-cv-slate">
                          {[
                            `due ${formatDate(item.due_date) ?? item.due_date}`,
                            item.evidence_id ? "evidence attached" : null,
                            item.status === "accepted" && item.acceptance_override_reason ? "accepted via override" : null,
                            item.status === "rejected" && item.rejection_reason ? `rejected: ${item.rejection_reason}` : null
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <StatusBadge className="shrink-0" label={item.status.replaceAll("_", " ")} tone={pbcTone(item.status)} />
                    </div>
                    {canWriteAudit && actions.length > 0 ? (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-white/60 pt-2">
                        {actions.map((a) => (
                          <button
                            key={a}
                            type="button"
                            onClick={() => setPbcTarget({ item, action: a })}
                            className={transitionBtn}
                            data-testid={`pbc-action-${a}`}
                          >
                            <ArrowRight size={11} />
                            {a}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>

      <FindingCreateModal
        engagementId={engagement.id}
        engagementTitle={title}
        open={findingModalOpen}
        onClose={() => setFindingModalOpen(false)}
      />
      <PbcItemCreateModal
        engagementId={engagement.id}
        engagementTitle={title}
        open={pbcModalOpen}
        onClose={() => setPbcModalOpen(false)}
      />
      <PbcActionModal
        engagementId={engagement.id}
        item={pbcTarget?.item ?? null}
        action={pbcTarget?.action ?? null}
        onClose={() => setPbcTarget(null)}
      />
    </div>
  );
}
