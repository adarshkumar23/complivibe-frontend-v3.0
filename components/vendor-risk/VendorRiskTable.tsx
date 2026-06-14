"use client";

import { useMemo, useState } from "react";
import { Search, Building, Building2, FileCheck2, ClipboardList, TriangleAlert } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeVendors, riskTone, statusTone } from "@/lib/api/vendor-risk-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { VendorRiskData } from "@/lib/hooks/useVendorRisk";

function distinct(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))];
}

function Count({ icon: Icon, value }: { icon: typeof FileCheck2; value: number | null }) {
  if (value == null) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-cv-slate ring-1 ring-slate-200/70">
      <Icon size={11} /> {value}
    </span>
  );
}

export function VendorRiskTable({ data }: { data: VendorRiskData }) {
  const { vendors } = data;
  const list = useMemo(() => normalizeVendors(vendors.data), [vendors.data]);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [risk, setRisk] = useState("all");

  const categories = useMemo(() => distinct(list.map((v) => v.category)), [list]);
  const risks = useMemo(() => distinct(list.map((v) => v.riskLevel)), [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((v) => {
      if (category !== "all" && v.category !== category) return false;
      if (risk !== "all" && v.riskLevel !== risk) return false;
      if (!q) return true;
      return [v.name, v.category, v.owner].filter(Boolean).some((s) => (s as string).toLowerCase().includes(q));
    });
  }, [list, query, category, risk]);

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
      title="Vendor Registry"
      subtitle="Third-party vendors & risk posture"
      icon={Building}
      accent="blue"
      action={vendors.isSuccess ? <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">{list.length} total</span> : null}
    >
      {vendors.isLoading ? (
        <SkeletonRows rows={6} />
      ) : vendors.isError ? (
        <ErrorState title="Vendor registry unavailable" description="The vendors endpoint did not respond. Linked evidence may still be available below." onRetry={() => vendors.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon={Building2} title="No vendors returned" description="Vendors, their risk levels, and review status will appear here once the backend provides them." />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 rounded-full bg-white/60 px-4 py-2.5 ring-1 ring-white/70 focus-within:ring-cv-blue/40">
              <Search size={16} className="shrink-0 text-cv-mist" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search vendors, categories, owners..." className="min-w-0 flex-1 bg-transparent text-sm text-cv-ink placeholder:text-cv-mist focus:outline-none" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={category} onChange={setCategory} allLabel="All categories" options={categories} />
              <Select value={risk} onChange={setRisk} allLabel="All risk levels" options={risks} />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState compact icon={Search} title="No vendors match your filters" description="Try adjusting search or filters." />
          ) : (
            <ul className="max-h-[560px] space-y-2.5 overflow-y-auto pr-1">
              {filtered.map((v) => (
                <li key={v.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <IconTile icon={Building2} accent="blue" size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-cv-ink">{v.name}</p>
                        <p className="truncate text-[11px] text-cv-slate">
                          {[v.category, v.owner].filter(Boolean).join(" · ") || "No category / owner"}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {v.riskLevel ? <StatusBadge label={v.riskLevel} tone={riskTone(v.riskLevel)} /> : null}
                      {v.status ? <StatusBadge label={v.status} tone={statusTone(v.status)} /> : null}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 pl-12 text-[11px] text-cv-mist">
                    <span>{v.lastReviewed ? `Reviewed ${formatDate(v.lastReviewed)}` : "Last review —"}</span>
                    <span>{v.nextReview ? `Next ${formatDate(v.nextReview)}` : "Next review —"}</span>
                    <Count icon={ClipboardList} value={v.questionnaireCount} />
                    <Count icon={FileCheck2} value={v.evidenceCount} />
                    <Count icon={TriangleAlert} value={v.riskCount} />
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
