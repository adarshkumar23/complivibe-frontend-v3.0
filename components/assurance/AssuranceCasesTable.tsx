"use client";

import { useMemo, useState } from "react";
import { Search, ClipboardCheck, Inbox, PenLine, RefreshCw, AlertTriangle, UserPlus, Link2, FileCheck2, type LucideIcon } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeAssuranceCases, statusTone, priorityTone } from "@/lib/api/assurance-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { AssuranceData } from "@/lib/hooks/useAssurance";

function distinct(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))];
}

/** No backend action endpoint exists — actions are disabled and never fake a result. */
function DisabledAction({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      disabled
      title="Action endpoint unavailable"
      className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full bg-white/55 px-2.5 py-1.5 text-[11px] font-semibold text-cv-mist ring-1 ring-white/60"
    >
      <Icon size={12} /> {label}
    </button>
  );
}

export function AssuranceCasesTable({ data }: { data: AssuranceData }) {
  const { cases } = data;
  const list = useMemo(() => normalizeAssuranceCases(cases.data), [cases.data]);

  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");

  const types = useMemo(() => distinct(list.map((c) => c.type)), [list]);
  const statuses = useMemo(() => distinct(list.map((c) => c.status)), [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((c) => {
      if (type !== "all" && c.type !== type) return false;
      if (status !== "all" && c.status !== status) return false;
      if (!q) return true;
      return [c.title, c.reviewer, c.type, c.linkedResource].filter(Boolean).some((v) => (v as string).toLowerCase().includes(q));
    });
  }, [list, query, type, status]);

  const selectCls = "cv-ring-focus rounded-full bg-white/60 px-3.5 py-2 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none";
  const Select = ({ value, onChange, allLabel, options }: { value: string; onChange: (v: string) => void; allLabel: string; options: string[] }) =>
    options.length === 0 ? null : (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
        <option value="all">{allLabel}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );

  return (
    <SectionCard
      title="Assurance Cases"
      subtitle="Expert review & sign-off cases"
      icon={ClipboardCheck}
      accent="blue"
      action={cases.isSuccess ? <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">{list.length} total</span> : null}
    >
      {cases.isLoading ? (
        <SkeletonRows rows={6} />
      ) : cases.isError ? (
        <ErrorState title="Assurance cases unavailable" description="The assurance endpoint did not respond on this backend yet. Linked work is shown alongside." onRetry={() => cases.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon={Inbox} title="No assurance cases returned" description="Review and sign-off cases will appear here once the backend provides them." />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 rounded-full bg-white/60 px-4 py-2.5 ring-1 ring-white/70 focus-within:ring-cv-blue/40">
              <Search size={16} className="shrink-0 text-cv-mist" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search cases, reviewers, resources..." className="min-w-0 flex-1 bg-transparent text-sm text-cv-ink placeholder:text-cv-mist focus:outline-none" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={type} onChange={setType} allLabel="All types" options={types} />
              <Select value={status} onChange={setStatus} allLabel="All statuses" options={statuses} />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState compact icon={Search} title="No cases match your filters" description="Try adjusting search or filters." />
          ) : (
            <ul className="max-h-[560px] space-y-2.5 overflow-y-auto pr-1">
              {filtered.map((c) => (
                <li key={c.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <IconTile icon={ClipboardCheck} accent="blue" size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-cv-ink">{c.title}</p>
                        <p className="truncate text-[11px] text-cv-slate">
                          {[c.type, c.reviewer ? `Reviewer ${c.reviewer}` : null].filter(Boolean).join(" · ") || "No type / reviewer"}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {c.status ? <StatusBadge label={c.status} tone={statusTone(c.status)} /> : <StatusBadge label="Unclassified" tone="neutral" />}
                      {c.priority ? <StatusBadge label={c.priority} tone={priorityTone(c.priority)} /> : null}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 pl-12 text-[11px] text-cv-mist">
                    <span>{c.dueDate ? `Due ${formatDate(c.dueDate)}` : "Due —"}</span>
                    {c.evidenceCount != null ? <span className="inline-flex items-center gap-1 font-medium text-cv-slate"><FileCheck2 size={11} /> {c.evidenceCount} evidence</span> : null}
                    {c.findingsCount != null ? <span className="font-medium text-cv-slate">{c.findingsCount} findings</span> : null}
                    {c.signOffStatus ? <span>Sign-off: {c.signOffStatus}</span> : null}
                    {c.linkedResource ? <span className="inline-flex items-center gap-1 font-medium text-cv-blue"><Link2 size={11} /> {c.linkedResource}</span> : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-white/50 pt-3 pl-12">
                    <DisabledAction icon={PenLine} label="Sign off" />
                    <DisabledAction icon={RefreshCw} label="Request changes" />
                    <DisabledAction icon={AlertTriangle} label="Escalate" />
                    <DisabledAction icon={UserPlus} label="Assign reviewer" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </SectionCard>
  );
}
