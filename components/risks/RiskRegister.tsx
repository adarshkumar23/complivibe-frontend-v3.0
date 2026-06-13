"use client";

import { useMemo, useState } from "react";
import { Search, TriangleAlert, ShieldCheck, FileCheck2, Cpu } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeRisks, isMitigated, type NormalizedRisk } from "@/lib/api/risk-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { Accent } from "@/components/ui/accent";
import type { Severity } from "@/lib/api/types";
import type { RisksData } from "@/lib/hooks/useRisks";

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

export function RiskRegister({ data }: { data: RisksData }) {
  const { risks } = data;
  const list = useMemo(() => normalizeRisks(risks.data), [risks.data]);

  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [owner, setOwner] = useState("all");

  const statuses = useMemo(() => distinct(list.map((r) => r.status)), [list]);
  const categories = useMemo(() => distinct(list.map((r) => r.category)), [list]);
  const owners = useMemo(() => distinct(list.map((r) => r.owner)), [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((r) => {
      if (severity !== "all" && r.severity !== severity) return false;
      if (status !== "all" && r.status !== status) return false;
      if (category !== "all" && r.category !== category) return false;
      if (owner !== "all" && r.owner !== owner) return false;
      if (!q) return true;
      return [r.title, r.owner, r.category, r.aiSystem, r.mitigation]
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

  function statusTone(r: NormalizedRisk): "good" | "warn" | "neutral" {
    if (!r.status) return "neutral";
    return isMitigated(r.status) ? "good" : "warn";
  }

  return (
    <SectionCard
      title="Risk Register"
      subtitle="Searchable, filterable risk inventory"
      icon={TriangleAlert}
      accent="red"
      className="h-full"
      action={
        risks.isSuccess ? (
          <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
            {list.length} total
          </span>
        ) : null
      }
    >
      {risks.isLoading ? (
        <SkeletonRows rows={6} />
      ) : risks.isError ? (
        <ErrorState title="Unable to load risks" onRetry={() => risks.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No risks recorded" description="Risks with owners, severity, and mitigation status will appear here once registered." />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 rounded-full bg-white/60 px-4 py-2.5 ring-1 ring-white/70 focus-within:ring-cv-blue/40">
              <Search size={16} className="shrink-0 text-cv-mist" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search risks, owners, categories..."
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
            <EmptyState compact icon={Search} title="No risks match your filters" description="Try adjusting search or filters." />
          ) : (
            <ul className="max-h-[520px] space-y-2.5 overflow-y-auto pr-1">
              {filtered.map((r) => (
                <li key={r.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <IconTile icon={TriangleAlert} accent={sevAccent[r.severity]} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-cv-ink">{r.title}</p>
                        <p className="truncate text-[12px] text-cv-slate">
                          {[r.category, r.owner].filter(Boolean).join(" · ") || "No category / owner"}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {r.dueDate ? <span className="hidden text-[11px] font-medium text-cv-mist lg:inline">{formatDate(r.dueDate)}</span> : null}
                      {r.status ? <StatusBadge label={r.status} tone={statusTone(r)} /> : null}
                      {r.hasSeverity ? <SeverityBadge severity={r.severity} /> : null}
                    </div>
                  </div>
                  {(r.aiSystem || r.evidenceRef || r.mitigation) ? (
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 pl-12 text-[11px] text-cv-slate">
                      {r.aiSystem ? (
                        <span className="inline-flex items-center gap-1">
                          <Cpu size={12} className="text-cv-mist" /> {r.aiSystem}
                        </span>
                      ) : null}
                      {r.evidenceRef ? (
                        <span className="inline-flex items-center gap-1">
                          <FileCheck2 size={12} className="text-cv-mist" /> {r.evidenceRef}
                        </span>
                      ) : null}
                      {r.mitigation ? <span className="truncate">· {r.mitigation}</span> : null}
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
