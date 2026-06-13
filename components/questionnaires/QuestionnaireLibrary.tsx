"use client";

import { useMemo, useState } from "react";
import { Search, ClipboardList, FileText, Download } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeQuestionnaires, isComplete } from "@/lib/api/questionnaire-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { QuestionnairesData } from "@/lib/hooks/useQuestionnaires";

function distinct(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))];
}

export function QuestionnaireLibrary({ data }: { data: QuestionnairesData }) {
  const { questionnaires } = data;
  const list = useMemo(() => normalizeQuestionnaires(questionnaires.data), [questionnaires.data]);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [customer, setCustomer] = useState("all");

  const statuses = useMemo(() => distinct(list.map((q) => q.status)), [list]);
  const types = useMemo(() => distinct(list.map((q) => q.type)), [list]);
  const customers = useMemo(() => distinct(list.map((q) => q.customer)), [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      if (type !== "all" && item.type !== type) return false;
      if (customer !== "all" && item.customer !== customer) return false;
      if (!q) return true;
      return [item.title, item.customer, item.owner, item.type].filter(Boolean).some((v) => (v as string).toLowerCase().includes(q));
    });
  }, [list, query, status, type, customer]);

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
      title="Questionnaire Library"
      subtitle="Customer & procurement questionnaires"
      icon={ClipboardList}
      accent="blue"
      className="h-full"
      action={questionnaires.isSuccess ? <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">{list.length} total</span> : null}
    >
      {questionnaires.isLoading ? (
        <SkeletonRows rows={6} />
      ) : questionnaires.isError ? (
        <ErrorState title="Unable to load questionnaires" onRetry={() => questionnaires.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon={FileText} title="No questionnaires yet" description="Uploaded and assigned questionnaires will appear here with progress, status, and exports." />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 rounded-full bg-white/60 px-4 py-2.5 ring-1 ring-white/70 focus-within:ring-cv-blue/40">
              <Search size={16} className="shrink-0 text-cv-mist" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search questionnaires, customers..." className="min-w-0 flex-1 bg-transparent text-sm text-cv-ink placeholder:text-cv-mist focus:outline-none" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={status} onChange={setStatus} allLabel="All statuses" options={statuses} />
              <Select value={type} onChange={setType} allLabel="All types" options={types} />
              <Select value={customer} onChange={setCustomer} allLabel="All customers" options={customers} />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState compact icon={Search} title="No questionnaires match your filters" description="Try adjusting search or filters." />
          ) : (
            <ul className="max-h-[520px] space-y-2.5 overflow-y-auto pr-1">
              {filtered.map((q) => (
                <li key={q.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <IconTile icon={ClipboardList} accent={isComplete(q) ? "green" : "blue"} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-cv-ink">{q.title}</p>
                        <p className="truncate text-[12px] text-cv-slate">
                          {[q.customer, q.owner, q.dueDate ? `Due ${formatDate(q.dueDate)}` : null].filter(Boolean).join(" · ") || "No metadata"}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {q.status ? <StatusBadge label={q.status} tone={isComplete(q) ? "good" : "warn"} /> : null}
                      {q.url ? (
                        <a href={q.url} target="_blank" rel="noreferrer" className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-3 py-1.5 text-[11px] font-bold text-white shadow-button transition hover:-translate-y-0.5">
                          <Download size={13} /> Export
                        </a>
                      ) : (
                        <span className="hidden text-[11px] font-medium text-cv-mist sm:inline">No export link</span>
                      )}
                    </div>
                  </div>
                  {q.progress != null ? (
                    <div className="mt-2 flex items-center gap-2 pl-12">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-400/12">
                        <div className="h-full rounded-full bg-cv-brand" style={{ width: `${Math.max(3, Math.min(100, q.progress))}%` }} />
                      </div>
                      <span className="text-[11px] font-bold text-cv-slate">{q.progress}%</span>
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
