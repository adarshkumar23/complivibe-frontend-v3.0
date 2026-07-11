"use client";

import { Layers, ListChecks, CalendarClock, HelpCircle } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import type { RegulatoryData } from "@/lib/hooks/useRegulatory";

export function RegulatoryKpis({ data }: { data: RegulatoryData }) {
  const { catalog, active, deadlines, applicability } = data;

  const activeCount = active.isSuccess ? active.data.length : null;
  const catalogCount = catalog.isSuccess ? catalog.data.length : null;

  const app = applicability.data;
  const applicable = app ? app.applicable_obligations : null;
  const unknown = app ? app.unknown_obligations : null;

  const regFilings = deadlines.isSuccess
    ? deadlines.data.filter((d) => d.status === "upcoming" || d.status === "overdue").length
    : null;
  const overdueFilings = deadlines.isSuccess
    ? deadlines.data.filter((d) => d.status === "overdue" || (d.days_until_due != null && d.days_until_due < 0)).length
    : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi
        label="Active Frameworks"
        icon={Layers}
        accent="blue"
        value={activeCount}
        caption={catalogCount != null ? `of ${catalogCount} in catalog` : undefined}
        loading={active.isLoading}
        unavailableHint="Active frameworks unavailable"
      />
      <RegistryKpi
        label="Applicable Obligations"
        icon={ListChecks}
        accent="purple"
        value={applicable}
        caption={applicable != null ? "in selected framework" : undefined}
        loading={applicability.isLoading}
        unavailableHint="Applicability unavailable"
      />
      <RegistryKpi
        label="Unscoped Obligations"
        icon={HelpCircle}
        accent="amber"
        value={unknown}
        caption={unknown != null && unknown > 0 ? "need an applicability decision" : unknown === 0 ? "all decided" : undefined}
        loading={applicability.isLoading}
        unavailableHint="Applicability unavailable"
      />
      <RegistryKpi
        label="Regulatory Filings Open"
        icon={CalendarClock}
        accent="red"
        value={regFilings}
        caption={overdueFilings != null && overdueFilings > 0 ? `${overdueFilings} overdue` : regFilings != null ? "none overdue" : undefined}
        loading={deadlines.isLoading}
        unavailableHint="Deadlines unavailable"
      />
    </div>
  );
}
