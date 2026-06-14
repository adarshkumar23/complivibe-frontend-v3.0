"use client";

import { Building2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeWorkspace } from "@/lib/api/enterprise-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { EnterpriseData } from "@/lib/hooks/useEnterpriseControl";

function Row({ label, value }: { label: string; value: string | null }) {
  if (value == null) return null;
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/50 py-2.5 last:border-0">
      <span className="text-[12px] font-semibold text-cv-slate">{label}</span>
      <span className="truncate text-[13px] font-semibold text-cv-ink">{value}</span>
    </div>
  );
}

export function OrgProfilePanel({ data }: { data: EnterpriseData }) {
  const { organization, settings } = data;
  const ws = normalizeWorkspace(organization.data, settings.data);

  return (
    <SectionCard title="Organization Profile" subtitle="Workspace identity & plan" icon={Building2} accent="blue" className="h-full">
      {organization.isLoading ? (
        <SkeletonRows rows={4} />
      ) : organization.isError ? (
        <ErrorState title="Organization unavailable" description="The organization endpoint did not respond on this backend yet." onRetry={() => organization.refetch()} />
      ) : !ws.hasAny ? (
        <EmptyState icon={Building2} title="No organization data" description="Workspace name, plan, region, and status will appear here once the backend provides them." />
      ) : (
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="truncate text-[15px] font-bold text-cv-ink">{ws.name || "Workspace"}</p>
            {ws.status ? <StatusBadge label={ws.status} tone={/active|enabled|live/i.test(ws.status) ? "good" : "neutral"} /> : null}
          </div>
          <Row label="Workspace ID" value={ws.slug} />
          <Row label="Plan" value={ws.plan} />
          <Row label="Region" value={ws.region} />
          <Row label="Industry" value={ws.industry} />
          <Row label="Website" value={ws.website} />
          <Row label="Created" value={ws.createdAt ? formatDate(ws.createdAt) : null} />
        </div>
      )}
    </SectionCard>
  );
}
