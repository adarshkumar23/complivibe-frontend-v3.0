"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { Search, SearchX, Timer } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { SearchHitRow } from "@/components/search/SearchHitRow";
import { useDebouncedValue, useGlobalSearch } from "@/lib/hooks/useSearch";
import { SEARCH_ENTITY_META, SEARCH_ENTITY_TYPES, type SearchEntityType } from "@/lib/api/search";
import { cn } from "@/lib/utils/cn";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

const PAGE_LIMIT = 50;

function SearchPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const urlQuery = params.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const [types, setTypes] = useState<SearchEntityType[]>([]);

  // Follow topbar-driven navigation (?q= changes while already on this page).
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const debounced = useDebouncedValue(query, 300);
  const results = useGlobalSearch(debounced, types.length > 0 ? types : undefined, PAGE_LIMIT);

  const toggleType = (t: SearchEntityType) =>
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.replace(q ? `/dashboard/search?q=${encodeURIComponent(q)}` : "/dashboard/search");
  };

  const hits = results.data?.hits ?? [];
  const countsByType = hits.reduce<Record<string, number>>((acc, h) => {
    acc[h.entity_type] = (acc[h.entity_type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
              <Search size={15} />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Discovery</span>
          </div>
          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">Search</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-cv-slate">
            Fuzzy, org-scoped search across risks, controls, vendors, issues, policies and regulatory obligations.
          </p>
        </div>
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show" className="space-y-3">
        <form
          onSubmit={onSubmit}
          className="flex items-center gap-2.5 rounded-full cv-glass-strong px-4 py-3 shadow-glass focus-within:ring-2 focus-within:ring-cv-blue/30"
        >
          <Search size={17} className="shrink-0 text-cv-mist" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the workspace..."
            aria-label="Search query"
            autoFocus
            className="min-w-0 flex-1 bg-transparent text-sm text-cv-ink placeholder:text-cv-mist focus:outline-none"
          />
          {results.data ? (
            <span className="hidden shrink-0 items-center gap-1 text-[11px] font-semibold text-cv-mist sm:inline-flex">
              <Timer size={12} />
              {results.data.took_ms} ms
            </span>
          ) : null}
        </form>

        <div className="flex flex-wrap items-center gap-1.5">
          {SEARCH_ENTITY_TYPES.map((t) => {
            const meta = SEARCH_ENTITY_META[t];
            const active = types.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleType(t)}
                aria-pressed={active}
                className={cn(
                  "cv-ring-focus inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition",
                  active
                    ? "bg-cv-brand text-white ring-transparent shadow-button"
                    : "bg-white/60 text-cv-slate ring-white/70 hover:text-cv-ink"
                )}
              >
                <meta.icon size={13} />
                {meta.label}
                {countsByType[t] != null ? <span className={active ? "text-white/80" : "text-cv-mist"}>{countsByType[t]}</span> : null}
              </button>
            );
          })}
        </div>
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show">
        <SectionCard
          title="Results"
          subtitle={
            results.data
              ? `${hits.length} match${hits.length === 1 ? "" : "es"} for “${results.data.query}”`
              : "Type a query to search the live index"
          }
          icon={Search}
          accent="blue"
          action={results.data?.degraded ? <StatusBadge label="Degraded" tone="warn" /> : undefined}
        >
          {debounced.trim().length === 0 ? (
            <EmptyState
              icon={Search}
              title="Start typing to search"
              description="Results come from the live search index and deep-link to their registry pages."
            />
          ) : results.isLoading ? (
            <SkeletonRows rows={5} />
          ) : results.isError ? (
            <ErrorState
              title="Search unavailable"
              description={results.error instanceof Error ? results.error.message : "The search backend could not be reached."}
              onRetry={() => results.refetch()}
            />
          ) : results.data && hits.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={`No matches for “${results.data.query}”`}
              description={
                results.data.degraded
                  ? `Search is degraded${results.data.degraded_reason ? `: ${results.data.degraded_reason}` : ""}.`
                  : "Nothing in the live index matches this query for your organization."
              }
            />
          ) : (
            <div className="space-y-1">
              {hits.map((hit) => (
                <SearchHitRow key={`${hit.entity_type}-${hit.id}`} hit={hit} />
              ))}
            </div>
          )}
        </SectionCard>
      </motion.div>
    </div>
  );
}

export default function SearchPage() {
  // useSearchParams requires a Suspense boundary in the app router.
  return (
    <Suspense fallback={<SkeletonRows rows={5} />}>
      <SearchPageInner />
    </Suspense>
  );
}
