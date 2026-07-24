"use client";

import { useMemo, useState } from "react";
import { Search, ShieldCheck, Shield, Plus, Link2, FileText, Paperclip, Pencil, Archive } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { ResourceUsageChip } from "@/components/common/ResourceUsageChip";
import type { Severity } from "@/lib/api/types";
import type { Control } from "@/lib/api/controls";
import type { ControlsData } from "@/lib/hooks/useControls";
import { useHasPermission } from "@/lib/hooks/usePermissions";

function statusTone(status: string): "good" | "warn" | "bad" | "neutral" {
  switch (status) {
    case "implemented":
      return "good";
    case "in_progress":
      return "warn";
    case "not_started":
      return "bad";
    default:
      return "neutral";
  }
}

export function ControlsTable({
  data,
  onCreate,
  onEdit,
  onArchive,
  onLinkObligation,
  onLinkPolicy,
  onAttachEvidence
}: {
  data: ControlsData;
  onCreate?: () => void;
  onEdit?: (control: Control) => void;
  onArchive?: (control: Control) => void;
  onLinkObligation?: (control: Control) => void;
  onLinkPolicy?: (control: Control) => void;
  onAttachEvidence?: (control: Control) => void;
}) {
  const { controls } = data;
  const list = useMemo(() => controls.data ?? [], [controls.data]);
  // Gate the create action on controls:write so the UI never offers an action
  // the backend would 403 (mirrors the risks-domain useHasPermission gating).
  const canWriteControls = useHasPermission("controls:write");
  // Attach-evidence is an evidence:write action, gated on that permission.
  const canWriteEvidence = useHasPermission("evidence:write");

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((c) => {
      // Archived controls are retired — keep them out of the active register unless
      // explicitly filtered to that status. (Archive is not a hard delete.)
      if (status === "all" && c.status === "archived") return false;
      if (status !== "all" && c.status !== status) return false;
      if (!q) return true;
      return [c.title, c.control_code, c.control_type, c.description]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q));
    });
  }, [list, query, status]);

  return (
    <SectionCard
      title="Control Register"
      subtitle="Organizational controls with implementation status"
      icon={ShieldCheck}
      accent="blue"
      action={
        <div className="flex items-center gap-2">
          {controls.isSuccess ? (
            <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
              {list.length} controls
            </span>
          ) : null}
          <ResourceUsageChip resource="controls" />
          {onCreate && canWriteControls ? (
            <button
              type="button"
              onClick={onCreate}
              className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-3 py-1.5 text-[11px] font-bold text-white shadow-button transition hover:-translate-y-0.5"
            >
              <Plus size={12} strokeWidth={2.8} />
              New control
            </button>
          ) : null}
        </div>
      }
    >
      {controls.isLoading ? (
        <SkeletonRows rows={6} />
      ) : controls.isError ? (
        <ErrorState title="Unable to load controls" onRetry={() => controls.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No controls registered"
          description="Create controls or apply backend control suggestions from framework obligations."
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2.5 rounded-full bg-white/60 px-4 py-2.5 ring-1 ring-white/70 focus-within:ring-cv-blue/40">
              <Search size={16} className="shrink-0 text-cv-mist" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search controls by title, code, or type…"
                className="min-w-0 flex-1 bg-transparent text-sm text-cv-ink placeholder:text-cv-mist focus:outline-none"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filter controls by status"
              data-testid="controls-status-filter"
              className="cv-ring-focus rounded-full bg-white/60 px-3.5 py-2 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none"
            >
              <option value="all">Active (all)</option>
              <option value="not_started">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="implemented">Implemented</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {status === "archived" ? (
            <div
              data-testid="controls-archived-note"
              className="rounded-2xl bg-amber-50/70 px-4 py-3 text-[12px] text-amber-800 ring-1 ring-amber-200/70"
            >
              Archived controls are retained for the audit trail and kept out of the active register. Archiving is
              terminal — a control cannot be restored from archived; reinstate by creating a new control. (Enabling
              in-place restore requires a backend un-archive endpoint.)
            </div>
          ) : null}

          {filtered.length === 0 ? (
            <EmptyState compact icon={Search} title="No controls match" description="Try adjusting search or filters." />
          ) : (
            <ul className="space-y-2.5">
              {filtered.map((c) => (
                <li
                  key={c.id}
                  data-testid={`control-row-${c.id}`}
                  data-status={c.status}
                  className={`rounded-2xl px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85 ${
                    c.status === "archived" ? "bg-white/35 opacity-70" : "bg-white/55"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold leading-snug text-cv-ink">
                        {c.control_code ? <span className="mr-1.5 text-cv-blue">{c.control_code}</span> : null}
                        {c.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-cv-slate">
                        {[c.control_type?.replaceAll("_", " "), c.source]
                          .filter(Boolean)
                          .join(" · ")}
                        {c.last_reviewed_at == null ? " · never reviewed" : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {c.criticality ? <SeverityBadge severity={c.criticality as Severity} /> : null}
                      <StatusBadge label={c.status.replaceAll("_", " ")} tone={statusTone(c.status)} />
                    </div>
                  </div>
                  {onLinkObligation || onLinkPolicy || (onAttachEvidence && canWriteEvidence) || (canWriteControls && (onEdit || onArchive)) ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {onEdit && canWriteControls ? (
                        <button
                          type="button"
                          data-testid={`control-edit-${c.id}`}
                          onClick={() => onEdit(c)}
                          className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white"
                        >
                          <Pencil size={11} strokeWidth={2.6} />
                          Edit
                        </button>
                      ) : null}
                      {onArchive && canWriteControls && c.status !== "archived" ? (
                        <button
                          type="button"
                          data-testid={`control-archive-${c.id}`}
                          onClick={() => onArchive(c)}
                          className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-cv-slate ring-1 ring-white/70 transition hover:bg-white hover:text-rose-600"
                        >
                          <Archive size={11} strokeWidth={2.6} />
                          Archive
                        </button>
                      ) : null}
                      {onLinkObligation ? (
                        <button
                          type="button"
                          onClick={() => onLinkObligation(c)}
                          className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white"
                        >
                          <Link2 size={11} strokeWidth={2.6} />
                          Link obligation
                        </button>
                      ) : null}
                      {onLinkPolicy ? (
                        <button
                          type="button"
                          onClick={() => onLinkPolicy(c)}
                          className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white"
                        >
                          <FileText size={11} strokeWidth={2.6} />
                          Link policy
                        </button>
                      ) : null}
                      {onAttachEvidence && canWriteEvidence ? (
                        <button
                          type="button"
                          data-testid={`attach-evidence-${c.id}`}
                          onClick={() => onAttachEvidence(c)}
                          className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white"
                        >
                          <Paperclip size={11} strokeWidth={2.6} />
                          Attach evidence
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </SectionCard>
  );
}
