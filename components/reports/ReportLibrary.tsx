"use client";

import { useMemo, useState } from "react";
import { Search, FileStack, FileText, Download } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeReports, statusTone } from "@/lib/api/report-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { ReportsData } from "@/lib/hooks/useReports";

function distinct(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))];
}

export function ReportLibrary({ data }: { data: ReportsData }) {
  const { reports } = data;
  const list = useMemo(() => normalizeReports(reports.data), [reports.data]);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [framework, setFramework] = useState("all");
  const [format, setFormat] = useState("all");

  const statuses = useMemo(() => distinct(list.map((r) => r.status)), [list]);
  const types = useMemo(() => distinct(list.map((r) => r.type)), [list]);
  const frameworks = useMemo(() => distinct(list.map((r) => r.framework)), [list]);
  const formats = useMemo(() => distinct(list.map((r) => r.format)), [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (type !== "all" && r.type !== type) return false;
      if (framework !== "all" && r.framework !== framework) return false;
      if (format !== "all" && r.format !== format) return false;
      if (!q) return true;
      return [r.title, r.owner, r.type, r.framework].filter(Boolean).some((v) => (v as string).toLowerCase().includes(q));
    });
  }, [list, query, status, type, framework, format]);

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
      title="Report Library"
      subtitle="Generated reports & exports"
      icon={FileStack}
      accent="blue"
      className="h-full"
      action={
        reports.isSuccess ? (
          <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
            {list.length} total
          </span>
        ) : null
      }
    >
      {reports.isLoading ? (
        <SkeletonRows rows={6} />
      ) : reports.isError ? (
        <ErrorState title="Unable to load reports" onRetry={() => reports.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon={FileText} title="No reports generated yet" description="Generated and exported reports will appear here with status, format, and download links." />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 rounded-full bg-white/60 px-4 py-2.5 ring-1 ring-white/70 focus-within:ring-cv-blue/40">
              <Search size={16} className="shrink-0 text-cv-mist" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search reports, owners, frameworks..."
                className="min-w-0 flex-1 bg-transparent text-sm text-cv-ink placeholder:text-cv-mist focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={status} onChange={setStatus} allLabel="All statuses" options={statuses} />
              <Select value={type} onChange={setType} allLabel="All types" options={types} />
              <Select value={framework} onChange={setFramework} allLabel="All frameworks" options={frameworks} />
              <Select value={format} onChange={setFormat} allLabel="All formats" options={formats} />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState compact icon={Search} title="No reports match your filters" description="Try adjusting search or filters." />
          ) : (
            <ul className="max-h-[520px] space-y-2.5 overflow-y-auto pr-1">
              {filtered.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85">
                  <div className="flex min-w-0 items-center gap-3">
                    <IconTile icon={FileText} accent="blue" size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-cv-ink">{r.title}</p>
                      <p className="truncate text-[12px] text-cv-slate">
                        {[r.type, r.framework, r.owner, formatDate(r.createdAt)].filter(Boolean).join(" · ") || "No metadata"}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {r.size ? <span className="hidden text-[11px] font-medium text-cv-mist lg:inline">{r.size}</span> : null}
                    {r.format ? <StatusBadge label={r.format.toUpperCase()} tone="neutral" /> : null}
                    {r.status ? <StatusBadge label={r.status} tone={statusTone(r.status)} /> : null}
                    {r.url ? (
                      <a
                        href={r.url}
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
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </SectionCard>
  );
}
