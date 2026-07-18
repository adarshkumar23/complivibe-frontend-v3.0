"use client";

import { useState } from "react";
import { Building2, BadgeCheck, Plus, RefreshCcw, UsersRound } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { BusinessUnitFormModal } from "@/components/enterprise/BusinessUnitFormModal";
import { AccessCertCampaignModal } from "@/components/enterprise/AccessCertCampaignModal";
import { useHasPermission } from "@/lib/hooks/usePermissions";
import type { EnterpriseData } from "@/lib/hooks/useEnterpriseControl";

export function EnterpriseKpis({ data }: { data: EnterpriseData }) {
  const { businessUnits, accessCerts, recert, sod } = data;
  const r = recert.data;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi
        label="Business Units"
        icon={Building2}
        accent="blue"
        value={businessUnits.isSuccess ? businessUnits.data.length : null}
        loading={businessUnits.isLoading}
        unavailableHint="Business units unavailable"
      />
      <RegistryKpi
        label="Access Cert Campaigns"
        icon={BadgeCheck}
        accent="purple"
        value={accessCerts.isSuccess ? accessCerts.data.length : null}
        caption={accessCerts.isSuccess && accessCerts.data.length === 0 ? "no campaigns run yet" : undefined}
        loading={accessCerts.isLoading}
        unavailableHint="Campaigns unavailable"
      />
      <RegistryKpi
        label="Evidence Due Recert"
        icon={RefreshCcw}
        accent="amber"
        value={r ? r.due_evidence : null}
        caption={r ? `${r.expired_evidence} already expired` : undefined}
        loading={recert.isLoading}
        unavailableHint="Recertification summary unavailable"
      />
      <RegistryKpi
        label="SoD Findings"
        icon={UsersRound}
        accent="red"
        value={sod.isSuccess ? sod.data.length : null}
        caption={sod.isSuccess && sod.data.length === 0 ? "no conflicts detected" : undefined}
        loading={sod.isLoading}
        unavailableHint="SoD findings unavailable"
      />
    </div>
  );
}

/** Recertification workload from GET /api/v1/recertification/summary. */
export function RecertificationPanel({ data }: { data: EnterpriseData }) {
  const { recert } = data;
  const r = recert.data;

  const rows = r
    ? [
        { label: "Evidence due for recertification", value: r.due_evidence, bad: r.due_evidence > 0 },
        { label: "Evidence expired", value: r.expired_evidence, bad: r.expired_evidence > 0 },
        { label: "Evidence needing review", value: r.evidence_needing_review, bad: false },
        { label: "Control tests due", value: r.due_control_tests, bad: false },
        { label: "Control tests overdue", value: r.overdue_control_tests, bad: r.overdue_control_tests > 0 }
      ]
    : [];

  return (
    <SectionCard title="Recertification Workload" subtitle="What needs re-proving to stay audit-ready" icon={RefreshCcw} accent="amber" className="h-full">
      {recert.isLoading ? (
        <SkeletonRows rows={5} />
      ) : recert.isError ? (
        <ErrorState compact title="Unable to load recertification" onRetry={() => recert.refetch()} />
      ) : (
        <ul className="space-y-2.5">
          {rows.map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <span className="text-[13px] font-semibold text-cv-ink">{row.label}</span>
              <StatusBadge label={String(row.value)} tone={row.bad ? "warn" : "neutral"} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

/** Access certification campaigns from GET /api/v1/access-certifications/campaigns. */
export function AccessCertPanel({ data }: { data: EnterpriseData }) {
  const canWriteRecert = useHasPermission("recertification:write");
  const { accessCerts } = data;
  const list = accessCerts.data ?? [];
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <SectionCard
      title="Access Certifications"
      subtitle="Periodic access review campaigns"
      icon={BadgeCheck}
      accent="purple"
      className="h-full"
      action={
        <>
          {canWriteRecert ? (
            <button
              type="button"
              data-testid="new-accesscert-campaign"
              onClick={() => setCreateOpen(true)}
              className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-tile transition hover:opacity-90"
            >
              <Plus size={13} strokeWidth={2.6} />
              New campaign
            </button>
          ) : null}
          <AccessCertCampaignModal open={createOpen} onClose={() => setCreateOpen(false)} />
        </>
      }
    >
      {accessCerts.isLoading ? (
        <SkeletonRows rows={4} />
      ) : accessCerts.isError ? (
        <ErrorState compact title="Unable to load campaigns" onRetry={() => accessCerts.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          compact
          icon={BadgeCheck}
          title="No campaigns yet"
          description="Run an access certification campaign to attest who should retain access."
        />
      ) : (
        <ul className="space-y-2.5">
          {list.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <p className="truncate text-[13px] font-semibold text-cv-ink">{(c.name as string) ?? "Campaign"}</p>
              {c.status ? <StatusBadge label={String(c.status)} tone="info" /> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

/** Business units from GET /api/v1/compliance/business-units, with create. */
export function BusinessUnitsPanel({ data }: { data: EnterpriseData }) {
  // Business-unit create requires org-admin (backend does require_permission
  // "compliance:write" AND _require_org_admin -> role in {owner, admin}). org:update
  // is held by exactly {owner, admin}, so it is the correct org-admin proxy here --
  // compliance:write alone (which compliance_manager also holds) would show the
  // button to a CM who then gets a 403 "Org admin role required".
  const canManageBusinessUnits = useHasPermission("org:update");
  const { businessUnits } = data;
  const list = businessUnits.data ?? [];
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <SectionCard
      title="Business Units"
      subtitle="Organizational structure for scoping"
      icon={Building2}
      accent="blue"
      className="h-full"
      action={
        <>
          {canManageBusinessUnits ? (
            <button
              type="button"
              data-testid="new-business-unit"
              onClick={() => setCreateOpen(true)}
              className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-tile transition hover:opacity-90"
            >
              <Plus size={13} strokeWidth={2.6} />
              New unit
            </button>
          ) : null}
          <BusinessUnitFormModal open={createOpen} onClose={() => setCreateOpen(false)} businessUnits={list} />
        </>
      }
    >
      {businessUnits.isLoading ? (
        <SkeletonRows rows={4} />
      ) : businessUnits.isError ? (
        <ErrorState compact title="Unable to load business units" onRetry={() => businessUnits.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          compact
          icon={Building2}
          title="No business units"
          description="Create units to scope controls, readings, and reporting by org structure."
        />
      ) : (
        <ul className="space-y-2.5">
          {list.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{(b.name as string) ?? b.id}</p>
                {typeof b.code === "string" ? <p className="text-[11px] text-cv-slate">{b.code}</p> : null}
              </div>
              <StatusBadge label={b.is_active === false ? "inactive" : "active"} tone={b.is_active === false ? "neutral" : "good"} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
