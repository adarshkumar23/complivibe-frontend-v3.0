"use client";

import { ClipboardList, SearchCheck, TriangleAlert, PackageOpen } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import type { AuditPackData } from "@/lib/hooks/useAuditPack";

export function AuditPackKpis({ data }: { data: AuditPackData }) {
  const { dashboard, findings, pbc } = data;
  const d = dashboard.data;
  const f = findings.data;
  const p = pbc.data;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi
        label="Audit Engagements"
        icon={SearchCheck}
        accent="blue"
        value={d ? d.total_engagements : null}
        caption={d ? `${d.upcoming} upcoming · ${d.overdue} overdue` : undefined}
        loading={dashboard.isLoading}
        unavailableHint="Engagement dashboard unavailable"
      />
      <RegistryKpi
        label="Open Findings"
        icon={TriangleAlert}
        accent="red"
        value={f ? (f.by_status["open"] ?? 0) + (f.by_status["in_remediation"] ?? 0) : null}
        caption={f ? `${f.open_critical_count} critical · ${f.overdue_count} overdue` : undefined}
        loading={findings.isLoading}
        unavailableHint="Findings summary unavailable"
      />
      <RegistryKpi
        label="PBC Requests"
        icon={ClipboardList}
        accent="purple"
        value={p ? p.total_items : null}
        caption={p ? `${Math.round(p.completion_rate)}% complete · ${p.overdue_count} overdue` : undefined}
        loading={pbc.isLoading}
        unavailableHint="PBC summary unavailable"
      />
      <RegistryKpi
        label="Findings Linked to Risk"
        icon={PackageOpen}
        accent="teal"
        value={f ? f.linked_to_risk_count : null}
        caption={
          f
            ? f.total > 0 && f.linked_to_risk_count === 0
              ? "link findings to risks to drive treatment"
              : undefined
            : undefined
        }
        loading={findings.isLoading}
        unavailableHint="Findings summary unavailable"
      />
    </div>
  );
}
