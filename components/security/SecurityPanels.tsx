"use client";

import { useState } from "react";
import { Radar, Fingerprint, KeySquare, Plus, UsersRound } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { NhiFormModal } from "@/components/security/NhiFormModal";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { formatRelativeTime } from "@/lib/utils/format";
import { useHasPermission } from "@/lib/hooks/usePermissions";
import type { SecurityData } from "@/lib/hooks/useSecurity";

export function SecurityKpis({ data }: { data: SecurityData }) {
  const { scanSummary, nhi, sod } = data;
  const s = scanSummary.data;
  const n = nhi.data;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi
        label="Security Scans"
        icon={Radar}
        accent="blue"
        value={s ? s.total_scans : null}
        caption={s?.last_scan_at ? `last ${formatRelativeTime(s.last_scan_at)}` : s ? "no scans ingested yet" : undefined}
        loading={scanSummary.isLoading}
        unavailableHint="Scan summary unavailable"
      />
      <RegistryKpi
        label="Critical Findings"
        icon={Fingerprint}
        accent="red"
        value={s ? s.total_critical : null}
        caption={s ? `${s.total_issues_created} issues auto-created` : undefined}
        loading={scanSummary.isLoading}
        unavailableHint="Scan summary unavailable"
      />
      <RegistryKpi
        label="Non-Human Identities"
        icon={KeySquare}
        accent="purple"
        value={n ? n.total_identities : null}
        caption={
          n
            ? n.unrotated_identities + n.orphaned_identities > 0
              ? `${n.unrotated_identities} unrotated · ${n.orphaned_identities} orphaned`
              : "hygiene clean"
            : undefined
        }
        loading={nhi.isLoading}
        unavailableHint="NHI summary unavailable"
      />
      <RegistryKpi
        label="SoD Conflicts"
        icon={UsersRound}
        accent="amber"
        value={sod.isSuccess ? sod.data.length : null}
        caption={sod.isSuccess && sod.data.length === 0 ? "no separation-of-duties findings" : undefined}
        loading={sod.isLoading}
        unavailableHint="SoD findings unavailable"
      />
    </div>
  );
}

/** Recent scan jobs from GET /api/v1/security/scan-jobs. */
export function ScanJobsPanel({ data }: { data: SecurityData }) {
  const { scanJobs } = data;
  const list = scanJobs.data ?? [];

  return (
    <SectionCard title="Scan Jobs" subtitle="Ingested security scans" icon={Radar} accent="blue" className="h-full">
      {scanJobs.isLoading ? (
        <SkeletonRows rows={5} />
      ) : scanJobs.isError ? (
        <ErrorState title="Unable to load scan jobs" onRetry={() => scanJobs.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Radar}
          title="No scans ingested"
          description="Security scan results pushed via the ingest API will appear here."
        />
      ) : (
        <ul className="space-y-2.5">
          {list.map((j) => (
            <li key={j.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">
                  {(j.scan_source as string)?.replaceAll("_", " ") ?? "scan"}
                </p>
                <p className="text-[11px] text-cv-slate">{j.created_at ? formatRelativeTime(String(j.created_at)) : "—"}</p>
              </div>
              {j.status ? <StatusBadge label={String(j.status)} tone={j.status === "completed" ? "good" : "info"} /> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

/** NHI register from GET /api/v1/non-human-identities (+ /summary for KPIs). */
export function NhiPanel({ data }: { data: SecurityData }) {
  const canManageIdentity = useHasPermission("identity_governance:manage");
  const { nhi, nhiList } = data;
  const n = nhi.data;
  const list = nhiList.data ?? [];
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <SectionCard
      title="Non-Human Identities"
      subtitle="Service accounts, keys, and tokens"
      icon={KeySquare}
      accent="purple"
      action={
        <>
          {canManageIdentity ? (
            <button
              type="button"
              data-testid="register-nhi"
              onClick={() => setCreateOpen(true)}
              className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-tile transition hover:opacity-90"
            >
              <Plus size={13} strokeWidth={2.6} />
              Register
            </button>
          ) : null}
          <NhiFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
        </>
      }
    >
      {nhiList.isLoading || nhi.isLoading ? (
        <SkeletonRows rows={3} />
      ) : nhiList.isError ? (
        <ErrorState compact title="Unable to load identities" onRetry={() => nhiList.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState compact icon={KeySquare} title="No identities registered" description="Track service accounts and API keys here." />
      ) : (
        <ul className="space-y-2.5">
          {list.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{i.name}</p>
                <p className="text-[11px] text-cv-slate">
                  {[i.identity_type.replaceAll("_", " "), i.environment].filter(Boolean).join(" · ")}
                </p>
              </div>
              <StatusBadge
                label={i.risk_level}
                tone={i.risk_level === "critical" || i.risk_level === "high" ? "bad" : i.risk_level === "medium" ? "warn" : "neutral"}
              />
            </li>
          ))}
          {n && n.unrotated_identities + n.orphaned_identities > 0 ? (
            <li className="rounded-xl bg-amber-400/10 px-3 py-2 text-[11px] font-semibold text-amber-600 ring-1 ring-amber-400/20">
              {n.unrotated_identities} unrotated · {n.orphaned_identities} orphaned — hygiene attention needed
            </li>
          ) : null}
        </ul>
      )}
    </SectionCard>
  );
}
