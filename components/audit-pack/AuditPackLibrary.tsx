"use client";

import { useMemo, useState } from "react";
import { Search, Boxes, PackageCheck, Download } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeAuditPacks, statusTone } from "@/lib/api/audit-pack-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { AuditPackData } from "@/lib/hooks/useAuditPack";

function distinct(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))];
}

function Count({ label, value }: { label: string; value: number | null }) {
  if (value == null) return null;
  return (
    <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-cv-slate ring-1 ring-slate-200/70">
      {value} {label}
    </span>
  );
}

export function AuditPackLibrary({ data }: { data: AuditPackData }) {
  const { packs } = data;
  const list = useMemo(() => normalizeAuditPacks(packs.data), [packs.data]);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [framework, setFramework] = useState("all");
  const [owner, setOwner] = useState("all");

  const statuses = useMemo(() => distinct(list.map((p) => p.status)), [list]);
  const frameworks = useMemo(() => distinct(list.map((p) => p.framework)), [list]);
  const owners = useMemo(() => distinct(list.map((p) => p.owner)), [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (framework !== "all" && p.framework !== framework) return false;
      if (owner !== "all" && p.owner !== owner) return false;
      if (!q) return true;
      return [p.title, p.owner, p.framework].filter(Boolean).some((v) => (v as string).toLowerCase().includes(q));
    });
  }, [list, query, status, framework, owner]);

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
      title="Audit Pack Library"
      subtitle="Generated review packs & exports"
      icon={Boxes}
      accent="blue"
      className="h-full"
      action={
        packs.isSuccess ? (
          <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
            {list.length} total
          </span>
        ) : null
      }
    >
      {packs.isLoading ? (
        <SkeletonRows rows={5} />
      ) : packs.isError ? (
        <ErrorState title="Audit packs unavailable" description="The audit-pack endpoint did not respond. Other sections still work." onRetry={() => packs.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon={PackageCheck} title="No audit packs yet" description="Generated audit packs will appear here with framework, status, contents, and download links." />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 rounded-full bg-white/60 px-4 py-2.5 ring-1 ring-white/70 focus-within:ring-cv-blue/40">
              <Search size={16} className="shrink-0 text-cv-mist" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search packs, owners, frameworks..."
                className="min-w-0 flex-1 bg-transparent text-sm text-cv-ink placeholder:text-cv-mist focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={status} onChange={setStatus} allLabel="All statuses" options={statuses} />
              <Select value={framework} onChange={setFramework} allLabel="All frameworks" options={frameworks} />
              <Select value={owner} onChange={setOwner} allLabel="All owners" options={owners} />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState compact icon={Search} title="No packs match your filters" description="Try adjusting search or filters." />
          ) : (
            <ul className="max-h-[520px] space-y-2.5 overflow-y-auto pr-1">
              {filtered.map((p) => (
                <li key={p.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <IconTile icon={PackageCheck} accent="blue" size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-cv-ink">{p.title}</p>
                        <p className="truncate text-[12px] text-cv-slate">
                          {[p.framework, p.owner, formatDate(p.createdAt)].filter(Boolean).join(" · ") || "No metadata"}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {p.status ? <StatusBadge label={p.status} tone={statusTone(p.status)} /> : null}
                      {p.url ? (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-3 py-1.5 text-[11px] font-bold text-white shadow-button transition hover:-translate-y-0.5"
                        >
                          <Download size={13} /> Export
                        </a>
                      ) : (
                        <span className="hidden text-[11px] font-medium text-cv-mist sm:inline">No export link</span>
                      )}
                    </div>
                  </div>
                  {p.evidenceCount != null || p.reportCount != null || p.riskCount != null || p.incidentCount != null ? (
                    <div className="mt-2 flex flex-wrap gap-1.5 pl-12">
                      <Count label="evidence" value={p.evidenceCount} />
                      <Count label="reports" value={p.reportCount} />
                      <Count label="risks" value={p.riskCount} />
                      <Count label="incidents" value={p.incidentCount} />
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
