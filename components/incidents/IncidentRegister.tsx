"use client";

import { useMemo, useState } from "react";
import { Search, Siren, ShieldCheck, Cpu, FileCheck2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeIncidents, isResolved } from "@/lib/api/incident-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { Accent } from "@/components/ui/accent";
import type { Severity } from "@/lib/api/types";
import type { IncidentsData } from "@/lib/hooks/useIncidents";

type SeverityFilter = "all" | "critical" | "high" | "medium" | "low";

const SEV_FILTERS: { id: SeverityFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "critical", label: "Critical" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" }
];

const sevAccent: Record<Severity, Accent> = { critical: "red", high: "red", medium: "amber", low: "green", info: "blue" };

function distinct(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))];
}

export function IncidentRegister({ data }: { data: IncidentsData }) {
  const { incidents } = data;
  const list = useMemo(() => normalizeIncidents(incidents.data), [incidents.data]);

  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [owner, setOwner] = useState("all");

  const statuses = useMemo(() => distinct(list.map((i) => i.status)), [list]);
  const categories = useMemo(() => distinct(list.map((i) => i.category)), [list]);
  const owners = useMemo(() => distinct(list.map((i) => i.owner)), [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((i) => {
      if (severity !== "all" && i.severity !== severity) return false;
      if (status !== "all" && i.status !== status) return false;
      if (category !== "all" && i.category !== category) return false;
      if (owner !== "all" && i.owner !== owner) return false;
      if (!q) return true;
      return [i.title, i.owner, i.category, i.aiSystem, i.description]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q));
    });
  }, [list, query, severity, status, category, owner]);

  const selectCls =
    "cv-ring-focus rounded-full bg-white/60 px-3.5 py-2 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none";

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
      title="Incident Register"
      subtitle="Searchable, filterable incident records"
      icon={Siren}
      accent="red"
      className="h-full"
      action={
        incidents.isSuccess ? (
          <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
            {list.length} total
          </span>
        ) : null
      }
    >
      {incidents.isLoading ? (
        <SkeletonRows rows={6} />
      ) : incidents.isError ? (
        <ErrorState title="Unable to load incidents" onRetry={() => incidents.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No incidents recorded" description="Incidents with owners, severity, and status will appear here once reported." />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 rounded-full bg-white/60 px-4 py-2.5 ring-1 ring-white/70 focus-within:ring-cv-blue/40">
              <Search size={16} className="shrink-0 text-cv-mist" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search incidents, owners, systems..."
                className="min-w-0 flex-1 bg-transparent text-sm text-cv-ink placeholder:text-cv-mist focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-white/55 p-1 ring-1 ring-white/70">
                {SEV_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSeverity(f.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      severity === f.id ? "bg-cv-brand text-white shadow-button" : "text-cv-slate hover:text-cv-ink"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <Select value={status} onChange={setStatus} allLabel="All statuses" options={statuses} />
              <Select value={category} onChange={setCategory} allLabel="All categories" options={categories} />
              <Select value={owner} onChange={setOwner} allLabel="All owners" options={owners} />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState compact icon={Search} title="No incidents match your filters" description="Try adjusting search or filters." />
          ) : (
            <ul className="max-h-[520px] space-y-2.5 overflow-y-auto pr-1">
              {filtered.map((i) => (
                <li key={i.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <IconTile icon={Siren} accent={sevAccent[i.severity]} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-cv-ink">{i.title}</p>
                        <p className="truncate text-[12px] text-cv-slate">
                          {[i.category, i.owner].filter(Boolean).join(" · ") || "No category / owner"}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {i.detectedAt ? <span className="hidden text-[11px] font-medium text-cv-mist lg:inline">{formatDate(i.detectedAt)}</span> : null}
                      {i.status ? <StatusBadge label={i.status} tone={isResolved(i.status) ? "good" : "warn"} /> : null}
                      {i.hasSeverity ? <SeverityBadge severity={i.severity} /> : null}
                    </div>
                  </div>
                  {(i.aiSystem || i.evidenceRef) ? (
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 pl-12 text-[11px] text-cv-slate">
                      {i.aiSystem ? (
                        <span className="inline-flex items-center gap-1">
                          <Cpu size={12} className="text-cv-mist" /> {i.aiSystem}
                        </span>
                      ) : null}
                      {i.evidenceRef ? (
                        <span className="inline-flex items-center gap-1">
                          <FileCheck2 size={12} className="text-cv-mist" /> {i.evidenceRef}
                        </span>
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
