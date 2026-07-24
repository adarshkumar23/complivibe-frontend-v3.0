"use client";

import { useState } from "react";
import { Siren, Loader2, Clock, ShieldAlert } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/utils/format";
import { useHasPermission } from "@/lib/hooks/usePermissions";
import type { Issue } from "@/lib/api/compliance";
import type { BreachNotification, BreachStatus } from "@/lib/api/breach";
import {
  useBreachNotifications,
  useRecordRegulatorNotification,
  useRecordSubjectNotification,
  useCloseBreach
} from "@/lib/hooks/useBreach";
import { BreachDeclareModal } from "@/components/incidents/BreachDeclareModal";

function statusTone(s: BreachStatus): "good" | "warn" | "bad" | "neutral" | "info" {
  switch (s) {
    case "closed": return "good";
    case "regulator_notified": case "subjects_notified": return "info";
    case "notification_due": return "bad";
    default: return "warn";
  }
}

function Deadline({ b }: { b: BreachNotification }) {
  if (!b.regulatory_notification_required) return <span className="text-[11px] text-cv-mist">No regulatory notification required</span>;
  if (!b.regulatory_notification_deadline) return <span className="text-[11px] text-cv-mist">Deadline pending</span>;
  const overdue = b.overdue_by_hours > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${overdue ? "text-rose-600" : "text-cv-slate"}`}>
      <Clock size={11} />
      {formatDate(b.regulatory_notification_deadline) ?? b.regulatory_notification_deadline}
      {" · "}
      {overdue ? `overdue by ${b.overdue_by_hours}h` : `${b.time_to_deadline_hours ?? 0}h left`}
    </span>
  );
}

function BreachRow({ b, canAdmin }: { b: BreachNotification; canAdmin: boolean }) {
  const recReg = useRecordRegulatorNotification();
  const recSubj = useRecordSubjectNotification();
  const close = useCloseBreach();
  const [rowError, setRowError] = useState<string | null>(null);
  const busy = recReg.isPending || recSubj.isPending || close.isPending;

  async function act(fn: () => Promise<unknown>) {
    setRowError(null);
    try { await fn(); } catch (e) { setRowError(e instanceof ApiError ? e.message : "Action failed."); }
  }

  const canRecordRegulator = b.status === "assessing" || b.status === "notification_due";
  const canRecordSubject = b.status === "regulator_notified";
  const canClose = b.status !== "closed";

  return (
    <li className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70" data-testid={`breach-row-${b.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-cv-ink">
            <ShieldAlert size={12} className="mr-1 inline text-rose-500" />
            {b.breach_type.replaceAll("_", " ")}
            {b.regulatory_framework ? <span className="ml-1.5 text-cv-blue">{b.regulatory_framework.toUpperCase()}</span> : null}
            {b.estimated_affected_count != null ? <span className="ml-1.5 text-cv-mist">· ~{b.estimated_affected_count} records</span> : null}
          </p>
          <p className="mt-0.5"><Deadline b={b} /></p>
        </div>
        <span data-testid={`breach-status-${b.id}`} className="shrink-0"><StatusBadge label={b.status.replaceAll("_", " ")} tone={statusTone(b.status)} /></span>
      </div>
      {canAdmin && (canRecordRegulator || canRecordSubject || canClose) ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {canRecordRegulator ? (
            <button type="button" data-testid={`breach-record-regulator-${b.id}`} disabled={busy} onClick={() => act(() => recReg.mutateAsync(b.id))}
              className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white disabled:opacity-60">
              {recReg.isPending ? <Loader2 size={11} className="animate-spin" /> : null} Record regulator notification
            </button>
          ) : null}
          {canRecordSubject ? (
            <button type="button" data-testid={`breach-record-subject-${b.id}`} disabled={busy} onClick={() => act(() => recSubj.mutateAsync(b.id))}
              className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white disabled:opacity-60">
              {recSubj.isPending ? <Loader2 size={11} className="animate-spin" /> : null} Record subject notification
            </button>
          ) : null}
          {canClose ? (
            <button type="button" data-testid={`breach-close-${b.id}`} disabled={busy} onClick={() => act(() => close.mutateAsync(b.id))}
              className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-cv-slate ring-1 ring-white/70 transition hover:bg-white hover:text-cv-ink disabled:opacity-60">
              {close.isPending ? <Loader2 size={11} className="animate-spin" /> : null} Close
            </button>
          ) : null}
        </div>
      ) : null}
      {rowError ? <p className="mt-1.5 text-[11px] font-semibold text-rose-600">{rowError}</p> : null}
    </li>
  );
}

export function BreachPanel({ issues }: { issues: Issue[] }) {
  const breaches = useBreachNotifications();
  const canAdmin = useHasPermission("issues:admin");
  const [declareOpen, setDeclareOpen] = useState(false);
  const list = breaches.data ?? [];
  const breachedIssueIds = new Set(list.map((b) => b.issue_id));

  return (
    <SectionCard
      title="Breach Notifications"
      subtitle="Declared data breaches, their regulatory clock, and notification status"
      icon={Siren}
      accent="amber"
      action={
        canAdmin ? (
          <button
            type="button"
            data-testid="breach-declare"
            onClick={() => setDeclareOpen(true)}
            className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-button transition hover:bg-rose-500"
          >
            <Siren size={12} strokeWidth={2.6} /> Declare breach
          </button>
        ) : null
      }
    >
      {breaches.isLoading ? (
        <SkeletonRows rows={3} />
      ) : breaches.isError ? (
        <ErrorState title="Unable to load breach notifications" onRetry={() => breaches.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          compact
          icon={Siren}
          title="No breaches declared"
          description={canAdmin ? "Declare a breach to start the regulatory notification clock." : "Declared breaches will appear here."}
        />
      ) : (
        <ul className="space-y-2.5" data-testid="breach-list">
          {list.map((b) => (<BreachRow key={b.id} b={b} canAdmin={canAdmin} />))}
        </ul>
      )}
      <BreachDeclareModal open={declareOpen} onClose={() => setDeclareOpen(false)} issues={issues} breachedIssueIds={breachedIssueIds} />
    </SectionCard>
  );
}
