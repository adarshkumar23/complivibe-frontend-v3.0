"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowUpRight, CloudOff, FileQuestion } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { countByCategory, searchText, type SearchCategoryKey } from "@/lib/api/search-normalizers";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { GlobalSearchData } from "@/lib/hooks/useGlobalSearch";

function useDebounced<T>(value: T, ms = 200): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function SearchExperience({ data }: { data: GlobalSearchData }) {
  const { records, isLoading, allUnavailable, unavailableCount } = data;
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SearchCategoryKey | "all">("all");
  const debounced = useDebounced(query, 200).trim().toLowerCase();

  const counts = useMemo(() => countByCategory(records), [records]);
  const indexed = useMemo(() => records.map((r) => ({ r, text: searchText(r) })), [records]);

  const results = useMemo(() => {
    return indexed
      .filter(({ r }) => (category === "all" ? true : r.categoryKey === category))
      .filter(({ text }) => (debounced ? text.includes(debounced) : false))
      .slice(0, 100)
      .map(({ r }) => r);
  }, [indexed, category, debounced]);

  const chips = useMemo(() => [...counts.entries()].sort((a, b) => b[1] - a[1]), [counts]);

  return (
    <SectionCard title="Search" subtitle="Type to search across all available modules" icon={Search} accent="blue">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5 rounded-2xl bg-white/65 px-4 py-3 ring-1 ring-white/70 focus-within:ring-cv-blue/40">
          <Search size={18} className="shrink-0 text-cv-mist" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search governance records…"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-cv-ink placeholder:text-cv-mist focus:outline-none"
            autoFocus
          />
          {query ? (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="inline-flex h-7 w-7 items-center justify-center rounded-full text-cv-mist transition hover:bg-white/70 hover:text-cv-ink">
              <X size={16} />
            </button>
          ) : null}
        </div>

        {chips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" onClick={() => setCategory("all")} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition", category === "all" ? "bg-cv-brand text-white shadow-button" : "bg-white/55 text-cv-slate ring-1 ring-white/70 hover:text-cv-ink")}>
              All
            </button>
            {chips.map(([key, count]) => (
              <button key={key} type="button" onClick={() => setCategory(key)} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition", category === key ? "bg-cv-brand text-white shadow-button" : "bg-white/55 text-cv-slate ring-1 ring-white/70 hover:text-cv-ink")}>
                {records.find((r) => r.categoryKey === key)?.category} <span className="opacity-70">{count}</span>
              </button>
            ))}
          </div>
        ) : null}

        {unavailableCount > 0 && !allUnavailable ? (
          <p className="flex items-center gap-1.5 rounded-xl bg-amber-400/12 px-3 py-2 text-[11px] font-medium text-amber-700 ring-1 ring-amber-400/25">
            <CloudOff size={13} /> {unavailableCount} source{unavailableCount === 1 ? "" : "s"} unavailable — results may be partial.
          </p>
        ) : null}

        {isLoading && records.length === 0 ? (
          <div className="space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => <LoadingSkeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : allUnavailable ? (
          <EmptyState icon={CloudOff} title="Search sources unavailable from backend." description="No module endpoints returned data, so there is nothing to search yet." />
        ) : !debounced ? (
          <EmptyState icon={Search} title="Start typing to search" description={`${records.length} records across ${counts.size} modules are ready to search.`} />
        ) : results.length === 0 ? (
          <EmptyState icon={FileQuestion} title="No results" description="No records match your search. Try a different term or category." />
        ) : (
          <ul className="max-h-[600px] space-y-2.5 overflow-y-auto pr-1">
            {results.map((r) => (
              <li key={`${r.categoryKey}-${r.id}`} className="flex items-start justify-between gap-3 rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-cv-brand-soft px-2 py-0.5 text-[10px] font-semibold text-cv-blue ring-1 ring-white/60">{r.category}</span>
                    {r.status ? <StatusBadge label={r.status} tone="neutral" /> : null}
                  </div>
                  <p className="mt-1 truncate text-[14px] font-semibold text-cv-ink">{r.title}</p>
                  <p className="truncate text-[11px] text-cv-slate">
                    {[r.type, r.owner, r.linkedResource, formatDate(r.date)].filter(Boolean).join(" · ") || "No additional metadata"}
                  </p>
                  {r.description ? <p className="mt-0.5 line-clamp-1 text-[11px] text-cv-mist">{r.description}</p> : null}
                </div>
                {r.route ? (
                  <button type="button" onClick={() => router.push(r.route!)} className="cv-ring-focus inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-bold text-cv-ink ring-1 ring-white/70 transition hover:bg-white">
                    Open <ArrowUpRight size={13} />
                  </button>
                ) : (
                  <button type="button" disabled title="Target route unavailable" className="inline-flex shrink-0 cursor-not-allowed items-center gap-1.5 rounded-full bg-white/55 px-3 py-1.5 text-[11px] font-semibold text-cv-mist ring-1 ring-white/60">
                    Open
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </SectionCard>
  );
}
