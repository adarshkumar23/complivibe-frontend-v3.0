"use client";

import { useMemo, useState } from "react";
import { Search, ListChecks, FileText, Link2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeRegulatoryObligations, priorityTone } from "@/lib/api/regulatory-normalizers";
import type { RegulatoryData } from "@/lib/hooks/useRegulatory";

function distinct(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))];
}

export function ObligationsTable({ data }: { data: RegulatoryData }) {
  const { obligations } = data;
  const list = useMemo(() => normalizeRegulatoryObligations(obligations.data), [obligations.data]);

  const [query, setQuery] = useState("");
  const [framework, setFramework] = useState("all");
  const [category, setCategory] = useState("all");

  const frameworks = useMemo(() => distinct(list.map((o) => o.framework)), [list]);
  const categories = useMemo(() => distinct(list.map((o) => o.category)), [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((o) => {
      if (framework !== "all" && o.framework !== framework) return false;
      if (category !== "all" && o.category !== category) return false;
      if (!q) return true;
      return [o.title, o.framework, o.category, o.owner].filter(Boolean).some((v) => (v as string).toLowerCase().includes(q));
    });
  }, [list, query, framework, category]);

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
      title="Obligations Impact"
      subtitle="Regulatory obligations across frameworks"
      icon={ListChecks}
      accent="blue"
      action={obligations.isSuccess ? <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">{list.length} total</span> : null}
    >
      {obligations.isLoading ? (
        <SkeletonRows rows={6} />
      ) : obligations.isError ? (
        <ErrorState title="Unable to load obligations" onRetry={() => obligations.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon={FileText} title="No obligations returned" description="Regulatory obligations and their impact will appear here once the backend provides them." />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 rounded-full bg-white/60 px-4 py-2.5 ring-1 ring-white/70 focus-within:ring-cv-blue/40">
              <Search size={16} className="shrink-0 text-cv-mist" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search obligations, frameworks, owners..." className="min-w-0 flex-1 bg-transparent text-sm text-cv-ink placeholder:text-cv-mist focus:outline-none" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={framework} onChange={setFramework} allLabel="All frameworks" options={frameworks} />
              <Select value={category} onChange={setCategory} allLabel="All categories" options={categories} />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState compact icon={Search} title="No obligations match your filters" description="Try adjusting search or filters." />
          ) : (
            <ul className="max-h-[560px] space-y-2.5 overflow-y-auto pr-1">
              {filtered.map((o) => (
                <li key={o.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold leading-snug text-cv-ink">{o.title}</p>
                      <p className="mt-0.5 truncate text-[11px] text-cv-slate">
                        {[o.framework, o.category, o.owner].filter(Boolean).join(" · ") || "No framework / category / owner"}
                      </p>
                      {o.evidenceRef ? (
                        <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-cv-blue">
                          <Link2 size={12} /> {o.evidenceRef}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {o.priority ? <StatusBadge label={o.priority} tone={priorityTone(o.priority)} /> : null}
                      {o.status ? <StatusBadge label={o.status} tone="info" /> : null}
                    </div>
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
