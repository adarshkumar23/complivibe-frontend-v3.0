"use client";

import { useMemo, useState } from "react";
import { Search, ScrollText, FileText, Eye, FileSearch, RefreshCw, Download, FileCheck2, ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizePolicies, statusTone } from "@/lib/api/policy-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { PoliciesData } from "@/lib/hooks/usePolicies";

function distinct(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))];
}

/** Actions with no backend endpoint are disabled — never faked. */
function DisabledAction({ icon: Icon, label }: { icon: typeof Eye; label: string }) {
  return (
    <button
      type="button"
      disabled
      title="Action endpoint not available on this backend yet"
      className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full bg-white/55 px-3 py-1.5 text-[11px] font-semibold text-cv-mist ring-1 ring-white/60"
    >
      <Icon size={12} /> {label}
    </button>
  );
}

function Count({ icon: Icon, value }: { icon: typeof FileCheck2; value: number | null }) {
  if (value == null) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-cv-slate ring-1 ring-slate-200/70">
      <Icon size={11} /> {value}
    </span>
  );
}

export function PolicyLibrary({ data }: { data: PoliciesData }) {
  const { policies } = data;
  const list = useMemo(() => normalizePolicies(policies.data), [policies.data]);

  const [query, setQuery] = useState("");
  const [framework, setFramework] = useState("all");
  const [status, setStatus] = useState("all");

  const frameworks = useMemo(() => distinct(list.map((p) => p.framework)), [list]);
  const statuses = useMemo(() => distinct(list.map((p) => p.status)), [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((p) => {
      if (framework !== "all" && p.framework !== framework) return false;
      if (status !== "all" && p.status !== status) return false;
      if (!q) return true;
      return [p.name, p.framework, p.category, p.owner].filter(Boolean).some((s) => (s as string).toLowerCase().includes(q));
    });
  }, [list, query, framework, status]);

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
      title="Policy Library"
      subtitle="Governance policies & review cycles"
      icon={ScrollText}
      accent="blue"
      action={policies.isSuccess ? <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">{list.length} total</span> : null}
    >
      {policies.isLoading ? (
        <SkeletonRows rows={6} />
      ) : policies.isError ? (
        <ErrorState title="Policy library unavailable" description="The policies endpoint did not respond. Framework mapping may still be available." onRetry={() => policies.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon={FileText} title="No policies returned" description="Governance policies, owners, versions, and review dates will appear here once the backend provides them." />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 rounded-full bg-white/60 px-4 py-2.5 ring-1 ring-white/70 focus-within:ring-cv-blue/40">
              <Search size={16} className="shrink-0 text-cv-mist" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search policies, frameworks, owners..." className="min-w-0 flex-1 bg-transparent text-sm text-cv-ink placeholder:text-cv-mist focus:outline-none" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={framework} onChange={setFramework} allLabel="All frameworks" options={frameworks} />
              <Select value={status} onChange={setStatus} allLabel="All statuses" options={statuses} />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState compact icon={Search} title="No policies match your filters" description="Try adjusting search or filters." />
          ) : (
            <ul className="max-h-[560px] space-y-2.5 overflow-y-auto pr-1">
              {filtered.map((p) => (
                <li key={p.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <IconTile icon={FileText} accent="blue" size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-cv-ink">
                          {p.name}
                          {p.version ? <span className="ml-2 text-[11px] font-medium text-cv-mist">v{p.version}</span> : null}
                        </p>
                        <p className="truncate text-[11px] text-cv-slate">
                          {[p.framework || p.category, p.owner, p.lastUpdated ? `Updated ${formatDate(p.lastUpdated)}` : null].filter(Boolean).join(" · ") || "No metadata"}
                        </p>
                      </div>
                    </div>
                    {p.status ? <StatusBadge label={p.status} tone={statusTone(p.status)} /> : <StatusBadge label="Status unknown" tone="neutral" />}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 pl-12 text-[11px] text-cv-mist">
                    <span>{p.nextReview ? `Next review ${formatDate(p.nextReview)}` : "Next review —"}</span>
                    <Count icon={FileCheck2} value={p.evidenceCount} />
                    <Count icon={ShieldCheck} value={p.controlCount} />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 border-t border-white/50 pt-3 pl-12">
                    <DisabledAction icon={Eye} label="View" />
                    <DisabledAction icon={FileSearch} label="Review" />
                    <DisabledAction icon={RefreshCw} label="Request update" />
                    {p.url ? (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-3 py-1.5 text-[11px] font-bold text-white shadow-button transition hover:-translate-y-0.5"
                      >
                        <Download size={12} /> Export
                      </a>
                    ) : (
                      <DisabledAction icon={Download} label="Export" />
                    )}
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
