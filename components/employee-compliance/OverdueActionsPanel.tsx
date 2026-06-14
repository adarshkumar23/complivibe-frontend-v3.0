"use client";

import { AlarmClock, CheckCircle2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import {
  normalizeAcknowledgements, normalizeComplianceTasks, collectOverdue
} from "@/lib/api/employee-compliance-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { EmployeeComplianceData } from "@/lib/hooks/useEmployeeCompliance";

export function OverdueActionsPanel({ data }: { data: EmployeeComplianceData }) {
  const { acknowledgements, training, attestations } = data;

  const acks = acknowledgements.isSuccess ? normalizeAcknowledgements(acknowledgements.data) : [];
  const trainingList = training.isSuccess ? normalizeComplianceTasks(training.data, "training") : [];
  const attestationList = attestations.isSuccess ? normalizeComplianceTasks(attestations.data, "attestation") : [];

  const anySource = acknowledgements.isSuccess || training.isSuccess || attestations.isSuccess;
  const loading = acknowledgements.isLoading && training.isLoading && attestations.isLoading;
  const overdue = collectOverdue(acks, trainingList, attestationList).sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));

  return (
    <SectionCard title="Overdue Actions" subtitle="Past-due acknowledgements, training & attestations" icon={AlarmClock} accent="red" className="h-full">
      {loading ? (
        <SkeletonRows rows={4} />
      ) : !anySource ? (
        <EmptyState icon={AlarmClock} title="Employee compliance action data unavailable from backend." description="Overdue acknowledgements, training, and attestations will appear here once the backend exposes due dates and statuses." />
      ) : overdue.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="No overdue actions" description="No past-due employee compliance items were returned by the backend." />
      ) : (
        <ul className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
          {overdue.slice(0, 16).map((o) => (
            <li key={o.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{o.title}</p>
                <p className="truncate text-[11px] text-cv-slate">{[o.type, o.assignee, o.dueDate ? `Due ${formatDate(o.dueDate)}` : null].filter(Boolean).join(" · ") || "—"}</p>
              </div>
              <StatusBadge label={o.status || "Overdue"} tone="bad" />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
