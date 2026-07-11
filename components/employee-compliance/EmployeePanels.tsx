"use client";

import { GraduationCap, ClipboardSignature, TimerOff, UserCheck } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import type { EmployeeComplianceData } from "@/lib/hooks/useEmployeeCompliance";

export function EmployeeComplianceKpis({ data }: { data: EmployeeComplianceData }) {
  const { training, attestations } = data;
  const t = training.data;
  const a = attestations.data;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi
        label="Training Assigned"
        icon={GraduationCap}
        accent="blue"
        value={t ? t.total_assigned : null}
        caption={t ? `${t.total_completed} completed (${Math.round(t.overall_completion_rate * 100)}%)` : undefined}
        loading={training.isLoading}
        unavailableHint="Training summary unavailable"
      />
      <RegistryKpi
        label="Training Overdue"
        icon={TimerOff}
        accent="red"
        value={t ? t.overall_overdue_count : null}
        caption={t && t.overall_overdue_count > 0 ? "chase completions before audit" : undefined}
        loading={training.isLoading}
        unavailableHint="Training summary unavailable"
      />
      <RegistryKpi
        label="Active Attestation Campaigns"
        icon={ClipboardSignature}
        accent="purple"
        value={a ? a.active_campaigns : null}
        caption={a ? `${a.overdue_campaigns} overdue` : undefined}
        loading={attestations.isLoading}
        unavailableHint="Attestation dashboard unavailable"
      />
      <RegistryKpi
        label="Pending Attestations"
        icon={UserCheck}
        accent="amber"
        value={a ? a.pending_attestations_count : null}
        caption={a ? `${Math.round(a.overall_completion_rate * 100)}% overall completion` : undefined}
        loading={attestations.isLoading}
        unavailableHint="Attestation dashboard unavailable"
      />
    </div>
  );
}

/** Training records from GET /api/v1/training-analytics/records. */
export function TrainingRecordsPanel({ data }: { data: EmployeeComplianceData }) {
  const { records } = data;
  const list = records.data ?? [];

  return (
    <SectionCard title="Training Records" subtitle="Assignments and completion" icon={GraduationCap} accent="blue" className="h-full">
      {records.isLoading ? (
        <SkeletonRows rows={5} />
      ) : records.isError ? (
        <ErrorState title="Unable to load training records" onRetry={() => records.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No training assigned"
          description="Assign security and compliance training to start tracking completion."
        />
      ) : (
        <ul className="space-y-2.5">
          {list.slice(0, 10).map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <p className="truncate text-[13px] font-semibold text-cv-ink">
                {(r.training_type as string)?.replaceAll("_", " ") ?? "training"}
              </p>
              <StatusBadge label={r.completed ? "Completed" : "Pending"} tone={r.completed ? "good" : "warn"} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

/** Attestation campaigns from GET /api/v1/compliance/attestation-campaigns. */
export function AttestationCampaignsPanel({ data }: { data: EmployeeComplianceData }) {
  const { campaigns } = data;
  const raw = campaigns.data;
  const list = Array.isArray(raw) ? raw : (raw?.items ?? []);

  return (
    <SectionCard title="Attestation Campaigns" subtitle="Policy acknowledgement drives" icon={ClipboardSignature} accent="purple">
      {campaigns.isLoading ? (
        <SkeletonRows rows={4} />
      ) : campaigns.isError ? (
        <ErrorState compact title="Unable to load campaigns" onRetry={() => campaigns.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          compact
          icon={ClipboardSignature}
          title="No campaigns"
          description="Launch an attestation campaign to collect policy acknowledgements."
        />
      ) : (
        <ul className="space-y-2.5">
          {list.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <p className="truncate text-[13px] font-semibold text-cv-ink">{(c.title as string) ?? "Campaign"}</p>
              {c.status ? <StatusBadge label={String(c.status)} tone="info" /> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
