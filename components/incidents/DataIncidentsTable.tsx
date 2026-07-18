"use client";

import { useState } from "react";
import { Loader2, Plus, Search, ShieldAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { DataIncidentCreateModal } from "@/components/incidents/DataIncidentCreateModal";
import type { DataIncident } from "@/lib/api/data-observability";
import { DATA_INCIDENT_TERMINAL_STATUSES } from "@/lib/api/data-observability";
import { ApiError } from "@/lib/api/client";
import { useHasPermission } from "@/lib/hooks/usePermissions";
import {
  useContainDataIncident,
  useDismissDataIncident,
  useEscalateDataIncident,
  useInvestigateDataIncident,
  useResolveDataIncident,
  type IncidentsPageData
} from "@/lib/hooks/useIncidentsPage";
import type { Severity } from "@/lib/api/types";

function statusTone(status: string): "good" | "warn" | "bad" | "info" | "neutral" {
  if (status === "resolved") return "good";
  if (status === "dismissed") return "neutral";
  if (status === "contained") return "info";
  if (status === "investigating") return "warn";
  return "bad"; // "new"
}

const KNOWN_SEVERITIES = new Set(["critical", "high", "medium", "low", "info"]);
function asSeverity(s: string): Severity {
  return (KNOWN_SEVERITIES.has(s) ? s : "info") as Severity;
}

/** Compact row-scoped action bar: investigate / contain / resolve / dismiss / escalate. */
function IncidentActions({ incident }: { incident: DataIncident }) {
  const canWriteData = useHasPermission("data:write");
  const [notes, setNotes] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const investigate = useInvestigateDataIncident();
  const contain = useContainDataIncident();
  const resolve = useResolveDataIncident();
  const dismiss = useDismissDataIncident();
  const escalate = useEscalateDataIncident();

  const isTerminal = DATA_INCIDENT_TERMINAL_STATUSES.has(incident.status);
  const anyPending = investigate.isPending || contain.isPending || resolve.isPending || dismiss.isPending || escalate.isPending;

  const run = async (action: string, fn: () => Promise<unknown>) => {
    setRowError(null);
    setBusyAction(action);
    try {
      await fn();
      setNotes("");
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : "Action failed — the backend may be unavailable.");
    } finally {
      setBusyAction(null);
    }
  };

  const btn = (label: string, tone: "amber" | "blue" | "green" | "slate", action: string, onClick: () => void, disabled = false) => (
    <button
      type="button"
      onClick={onClick}
      disabled={anyPending || disabled}
      className={{
        amber: "bg-amber-500/12 text-amber-700 ring-amber-400/25 hover:bg-amber-500/20",
        blue: "bg-blue-500/12 text-blue-700 ring-blue-400/25 hover:bg-blue-500/20",
        green: "bg-emerald-500/12 text-emerald-700 ring-emerald-400/25 hover:bg-emerald-500/20",
        slate: "bg-slate-400/12 text-slate-600 ring-slate-400/25 hover:bg-slate-400/20"
      }[tone].concat(
        " cv-ring-focus inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 transition disabled:cursor-not-allowed disabled:opacity-50"
      )}
    >
      {busyAction === action ? <Loader2 size={11} className="animate-spin" /> : null}
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-2">
      {!isTerminal ? (
        canWriteData ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {incident.status === "new"
              ? btn("Investigate", "amber", "investigate", () => run("investigate", () => investigate.mutateAsync({ id: incident.id, notes })))
              : null}
            {btn("Contain", "blue", "contain", () => run("contain", () => contain.mutateAsync({ id: incident.id, notes })))}
            {btn("Resolve", "green", "resolve", () => run("resolve", () => resolve.mutateAsync({ id: incident.id, notes })))}
            {btn("Dismiss", "slate", "dismiss", () => run("dismiss", () => dismiss.mutateAsync({ id: incident.id, notes })))}
          </div>
        ) : null
      ) : (
        <StatusBadge label={incident.status === "resolved" ? "Resolved" : "Dismissed"} tone={incident.status === "resolved" ? "good" : "neutral"} />
      )}

      {!incident.escalated_to_issue ? (
        canWriteData ? (
          <button
            type="button"
            onClick={() => run("escalate", () => escalate.mutateAsync(incident.id))}
            disabled={anyPending}
            className="cv-ring-focus inline-flex w-fit items-center gap-1 rounded-full bg-rose-500/12 px-2.5 py-1 text-[11px] font-bold text-rose-700 ring-1 ring-rose-400/25 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busyAction === "escalate" ? <Loader2 size={11} className="animate-spin" /> : <TriangleAlert size={11} />}
            Escalate to compliance issue
          </button>
        ) : null
      ) : (
        <StatusBadge label="Escalated to issue" tone="purple" />
      )}

      {!isTerminal ? (
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional note for next action…"
          className="cv-ring-focus w-full max-w-xs rounded-lg bg-white/50 px-2.5 py-1.5 text-[11px] text-cv-ink ring-1 ring-white/60 placeholder:text-cv-mist focus:outline-none"
        />
      ) : null}

      {rowError ? <p className="max-w-xs text-[11px] font-semibold text-rose-600">{rowError}</p> : null}
    </div>
  );
}

export function DataIncidentsTable({ data }: { data: IncidentsPageData }) {
  const canWriteData = useHasPermission("data:write");
  const { dataIncidents, assets } = data;
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const rows = (dataIncidents.data ?? []).filter((i) => statusFilter === "all" || i.status === statusFilter);

  return (
    <SectionCard
      title="Data Observability Incidents"
      subtitle="Automated detector output + manual reports — app/data_observability/routers/incidents.py"
      icon={ShieldAlert}
      accent="red"
      action={
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-cv-mist" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by incident status"
              className="cv-ring-focus rounded-full bg-white/60 py-1.5 pl-7 pr-3 text-[11px] font-semibold text-cv-ink ring-1 ring-white/70 focus:outline-none"
            >
              <option value="all">All statuses</option>
              <option value="new">New</option>
              <option value="investigating">Investigating</option>
              <option value="contained">Contained</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
          {canWriteData ? (
            <button
              type="button"
              data-testid="report-incident"
              onClick={() => setModalOpen(true)}
              className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-4 py-2 text-xs font-bold text-white shadow-button transition hover:-translate-y-0.5"
            >
              <Plus size={14} strokeWidth={2.6} />
              Report incident
            </button>
          ) : null}
        </div>
      }
    >
      {dataIncidents.isLoading ? (
        <SkeletonRows rows={3} />
      ) : dataIncidents.isError ? (
        <ErrorState
          title="Data incidents could not load"
          description={dataIncidents.error instanceof Error ? dataIncidents.error.message : undefined}
          onRetry={() => dataIncidents.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={(dataIncidents.data ?? []).length === 0 ? "No data incidents recorded" : "No incidents match this filter"}
          description={
            (dataIncidents.data ?? []).length === 0
              ? "The live incidents endpoint returned zero rows for this organization. Detector-generated incidents and manual reports both appear here."
              : "Try a different status filter."
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-wide text-cv-mist">
                <th className="pb-2.5 pr-3">Incident</th>
                <th className="pb-2.5 pr-3">Severity</th>
                <th className="pb-2.5 pr-3">Status</th>
                <th className="pb-2.5 pr-3">Detector</th>
                <th className="pb-2.5 pr-3">Detected</th>
                <th className="pb-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/50">
              {rows.map((incident) => (
                <tr key={incident.id} className="align-top">
                  <td className="py-3 pr-3">
                    <p className="max-w-[220px] font-semibold text-cv-ink">{incident.title}</p>
                    <p className="mt-0.5 max-w-[220px] text-[11px] text-cv-slate">{incident.description}</p>
                    {incident.recurrence_count > 1 ? (
                      <p className="mt-0.5 text-[10px] font-semibold text-cv-mist">Recurred {incident.recurrence_count}x</p>
                    ) : null}
                  </td>
                  <td className="py-3 pr-3">
                    <SeverityBadge severity={asSeverity(incident.severity)} />
                  </td>
                  <td className="py-3 pr-3">
                    <StatusBadge label={incident.status} tone={statusTone(incident.status)} />
                  </td>
                  <td className="py-3 pr-3 text-xs font-medium text-cv-slate">{incident.detector_type.replace(/_/g, " ")}</td>
                  <td className="py-3 pr-3 text-xs text-cv-slate">
                    {new Date(incident.detected_at).toLocaleDateString()}
                    <br />
                    <span className="text-[10px] text-cv-mist">{incident.age_hours}h ago</span>
                  </td>
                  <td className="py-3">
                    <IncidentActions incident={incident} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DataIncidentCreateModal open={modalOpen} onClose={() => setModalOpen(false)} assets={assets.data ?? []} />
    </SectionCard>
  );
}
