"use client";

import { SlidersHorizontal } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { enterpriseControls, normalizeIntegrations } from "@/lib/api/enterprise-normalizers";
import type { EnterpriseData } from "@/lib/hooks/useEnterpriseControl";

export function EnterpriseControlsPanel({ data }: { data: EnterpriseData }) {
  const { securitySettings, settings, integrations } = data;

  const integrationList = integrations.isSuccess ? normalizeIntegrations(integrations.data) : null;
  const rows = enterpriseControls(securitySettings.data, settings.data, integrationList);
  const present = rows.filter((r) => r.value != null);

  const loading = securitySettings.isLoading && settings.isLoading && integrations.isLoading;

  return (
    <SectionCard title="Enterprise Controls" subtitle="Security, audit, retention & integration settings" icon={SlidersHorizontal} accent="purple" className="h-full">
      {loading ? (
        <SkeletonRows rows={5} />
      ) : present.length === 0 ? (
        <EmptyState icon={SlidersHorizontal} title="Control settings unavailable from backend." description="Security, audit, retention, and integration controls will appear here once the backend reports them." />
      ) : (
        <div>
          {present.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-4 border-b border-white/50 py-2.5 last:border-0">
              <span className="text-[12px] font-semibold text-cv-slate">{r.label}</span>
              <StatusBadge label={r.value as string} tone={/^enabled$/i.test(r.value as string) ? "good" : /^disabled$/i.test(r.value as string) ? "bad" : "neutral"} />
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
