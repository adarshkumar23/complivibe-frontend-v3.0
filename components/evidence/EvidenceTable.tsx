"use client";

import { useMemo, useState } from "react";
import { Search, FileText, FileStack, ExternalLink } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeEvidenceItems, evidenceFreshness, freshnessSummary, type FreshnessState } from "@/lib/api/evidence-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { Accent } from "@/components/ui/accent";
import type { EvidenceData } from "@/lib/hooks/useEvidence";

const freshnessAccent: Record<FreshnessState, Accent> = { fresh: "green", expiring: "amber", expired: "red", unknown: "blue" };
const freshnessTone: Record<FreshnessState, "good" | "warn" | "bad" | "neutral"> = {
  fresh: "good",
  expiring: "warn",
  expired: "bad",
  unknown: "neutral"
};
const freshnessLabel: Record<FreshnessState, string> = { fresh: "Fresh", expiring: "Expiring", expired: "Expired", unknown: "—" };

function distinct(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))];
}

export function EvidenceTable({ data }: { data: EvidenceData }) {
  const { evidence } = data;
  const items = useMemo(() => normalizeEvidenceItems(evidence.data), [evidence.data]);

  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [freshness, setFreshness] = useState("all");
  const [framework, setFramework] = useState("all");
  const [system, setSystem] = useState("all");

  const types = useMemo(() => distinct(items.map((i) => i.type)), [items]);
  const statuses = useMemo(() => distinct(items.map((i) => i.status)), [items]);
  const frameworks = useMemo(() => distinct(items.map((i) => i.framework)), [items]);
  const systems = useMemo(() => distinct(items.map((i) => i.aiSystem)), [items]);
  const hasFreshness = useMemo(() => freshnessSummary(items).hasSignal, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (type !== "all" && i.type !== type) return false;
      if (status !== "all" && i.status !== status) return false;
      if (framework !== "all" && i.framework !== framework) return false;
      if (system !== "all" && i.aiSystem !== system) return false;
      if (freshness !== "all" && evidenceFreshness(i) !== freshness) return false;
      if (!q) return true;
      return [i.title, i.owner, i.control, i.framework, i.aiSystem, i.type]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q));
    });
  }, [items, query, type, status, freshness, framework, system]);

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
      title="Evidence Records"
      subtitle="Searchable, filterable audit evidence"
      icon={FileStack}
      accent="blue"
      className="h-full"
      action={
        evidence.isSuccess ? (
          <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
            {items.length} total
          </span>
        ) : null
      }
    >
      {evidence.isLoading ? (
        <SkeletonRows rows={6} />
      ) : evidence.isError ? (
        <ErrorState title="Unable to load evidence" onRetry={() => evidence.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No evidence uploaded yet"
          description="Upload your first evidence file to start building an audit-ready chain of custody."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 rounded-full bg-white/60 px-4 py-2.5 ring-1 ring-white/70 focus-within:ring-cv-blue/40">
              <Search size={16} className="shrink-0 text-cv-mist" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search evidence, owners, controls..."
                className="min-w-0 flex-1 bg-transparent text-sm text-cv-ink placeholder:text-cv-mist focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={type} onChange={setType} allLabel="All types" options={types} />
              <Select value={status} onChange={setStatus} allLabel="All statuses" options={statuses} />
              {hasFreshness ? (
                <select value={freshness} onChange={(e) => setFreshness(e.target.value)} className={selectCls}>
                  <option value="all">All freshness</option>
                  <option value="fresh">Fresh</option>
                  <option value="expiring">Expiring</option>
                  <option value="expired">Expired</option>
                </select>
              ) : null}
              <Select value={framework} onChange={setFramework} allLabel="All frameworks" options={frameworks} />
              <Select value={system} onChange={setSystem} allLabel="All AI systems" options={systems} />
            </div>
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <EmptyState compact icon={Search} title="No evidence matches your filters" description="Try adjusting search or filters." />
          ) : (
            <ul className="max-h-[520px] space-y-2.5 overflow-y-auto pr-1">
              {filtered.map((i) => {
                const state = evidenceFreshness(i);
                return (
                  <li
                    key={i.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <IconTile icon={FileText} accent={freshnessAccent[state]} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-cv-ink">{i.title}</p>
                        <p className="truncate text-[12px] text-cv-slate">
                          {[i.type, i.owner, i.control || i.framework, i.aiSystem].filter(Boolean).join(" · ") || "No metadata"}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {formatDate(i.expiresAt || i.updatedAt || i.createdAt) ? (
                        <span className="hidden text-[11px] font-medium text-cv-mist lg:inline">
                          {formatDate(i.expiresAt || i.updatedAt || i.createdAt)}
                        </span>
                      ) : null}
                      {i.status ? <StatusBadge label={i.status} tone="info" /> : null}
                      {state !== "unknown" ? <StatusBadge label={freshnessLabel[state]} tone={freshnessTone[state]} /> : null}
                      {i.url ? (
                        <a
                          href={i.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-cv-mist transition hover:bg-white/70 hover:text-cv-blue"
                          aria-label="Open evidence"
                        >
                          <ExternalLink size={14} />
                        </a>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </SectionCard>
  );
}
