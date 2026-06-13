"use client";

import { Layers, FolderOpen, Flame, ShieldCheck, AlarmClockOff, Timer } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import {
  normalizeIncidents,
  isResolved,
  isSlaBreached,
  averageResolutionHours,
  formatDurationHours
} from "@/lib/api/incident-normalizers";
import type { IncidentsData } from "@/lib/hooks/useIncidents";

export function IncidentKpis({ data }: { data: IncidentsData }) {
  const { incidents } = data;
  const list = normalizeIncidents(incidents.data);
  const ok = incidents.isSuccess;
  const loading = incidents.isLoading;

  const total = ok ? list.length : null;
  const anyStatus = list.some((i) => i.status);
  const open = ok && anyStatus ? list.filter((i) => i.status && !isResolved(i.status)).length : null;
  const resolved = ok && anyStatus ? list.filter((i) => isResolved(i.status)).length : null;
  const critical = ok ? list.filter((i) => i.severity === "critical" || i.severity === "high").length : null;

  const anyDue = list.some((i) => i.dueDate);
  const slaBreaches = ok && anyDue ? list.filter(isSlaBreached).length : null;

  const avgHours = averageResolutionHours(list);
  const avgValue =
    avgHours == null ? null : avgHours < 48 ? Math.round(avgHours) : Math.round(avgHours / 24);
  const avgSuffix = avgHours == null ? "" : avgHours < 1 ? "m" : avgHours < 48 ? "h" : "d";
  const avgDisplay = avgHours != null && avgHours < 1 ? Math.round(avgHours * 60) : avgValue;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      <RegistryKpi label="Total Incidents" icon={Layers} accent="blue" value={total} caption={total != null ? "in register" : undefined} loading={loading} unavailableHint="Register unavailable" />
      <RegistryKpi label="Open Incidents" icon={FolderOpen} accent="amber" value={open} caption={open != null ? "not resolved" : undefined} loading={loading} unavailableHint="No status field" />
      <RegistryKpi label="Critical / High" icon={Flame} accent="red" value={critical} caption={critical != null ? "elevated severity" : undefined} loading={loading} unavailableHint="Register unavailable" />
      <RegistryKpi label="Resolved Incidents" icon={ShieldCheck} accent="green" value={resolved} caption={resolved != null ? "closed out" : undefined} loading={loading} unavailableHint="No status field" />
      <RegistryKpi label="SLA Breaches" icon={AlarmClockOff} accent="red" value={slaBreaches} caption={slaBreaches != null ? "past SLA due" : undefined} loading={loading} unavailableHint="No SLA dates" />
      <RegistryKpi
        label="Avg Resolution Time"
        icon={Timer}
        accent="purple"
        value={avgDisplay}
        suffix={avgSuffix}
        caption={avgHours != null ? formatDurationHours(avgHours) + " mean" : undefined}
        loading={loading}
        unavailableHint="No timestamps"
      />
    </div>
  );
}
