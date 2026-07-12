"use client";

import { useMemo, useState } from "react";
import { Search, ShieldCheck, Shield, Plus, Link2, FileText } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import type { Severity } from "@/lib/api/types";
import type { Control } from "@/lib/api/controls";
import type { ControlsData } from "@/lib/hooks/useControls";

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
  onLinkObligation,
  onLinkPolicy
}: {
  data: ControlsData;
  onCreate?: () => void;
  onLinkObligation?: (control: Control) => void;
  onLinkPolicy?: (control: Control) => void;
}) {
  const { controls } = data;
  const list = useMemo(() => controls.data ?? [], [controls.data]);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((c) => {
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
          {onCreate ? (
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
              className="cv-ring-focus rounded-full bg-white/60 px-3.5 py-2 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none"
            >
              <option value="all">All statuses</option>
              <option value="not_started">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="implemented">Implemented</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState compact icon={Search} title="No controls match" description="Try adjusting search or filters." />
          ) : (
            <ul className="space-y-2.5">
              {filtered.map((c) => (
                <li key={c.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85">
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
                  {onLinkObligation || onLinkPolicy ? (
                    <div className="mt-2 flex items-center gap-2">
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
