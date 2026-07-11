"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Sparkles, Menu, SearchX, TriangleAlert } from "lucide-react";
import { useUiStore } from "@/store/ui-store";
import { useDebouncedValue, useGlobalSearch } from "@/lib/hooks/useSearch";
import { SearchHitRow } from "@/components/search/SearchHitRow";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

const DROPDOWN_LIMIT = 8;

export function Topbar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const toggleCopilot = useUiStore((s) => s.toggleCopilot);

  const debounced = useDebouncedValue(query, 250);
  const results = useGlobalSearch(open ? debounced : "", undefined, DROPDOWN_LIMIT);
  const showDropdown = open && query.trim().length > 0;

  // Close the live-results dropdown on any outside click.
  useEffect(() => {
    if (!showDropdown) return;
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showDropdown]);

  const goToResultsPage = () => {
    const q = query.trim();
    setOpen(false);
    router.push(q ? `/dashboard/search?q=${encodeURIComponent(q)}` : "/dashboard/search");
  };

  const onSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    goToResultsPage();
  };

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6 lg:px-0 lg:pr-6 lg:pt-5">
      <div className="flex items-center gap-3 rounded-full cv-glass-strong px-3 py-2.5 shadow-glass sm:px-4">
        {/* Mobile menu */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-cv-slate ring-1 ring-white/70 transition hover:text-cv-ink lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        {/* Search */}
        <div ref={containerRef} className="relative min-w-0 flex-1">
          <form
            onSubmit={onSearchSubmit}
            className="flex min-w-0 items-center gap-2.5 rounded-full bg-white/55 px-4 py-2.5 ring-1 ring-white/70 focus-within:ring-cv-blue/40"
          >
            <Search size={17} className="shrink-0 text-cv-mist" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
              }}
              placeholder="Search risks, controls, vendors, policies..."
              aria-label="Search the workspace"
              className="min-w-0 flex-1 bg-transparent text-sm text-cv-ink placeholder:text-cv-mist focus:outline-none"
            />
            <kbd className="hidden shrink-0 rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold text-cv-mist ring-1 ring-slate-200/70 sm:inline-block">
              ↵
            </kbd>
          </form>

          {showDropdown ? (
            <div
              data-testid="topbar-search-dropdown"
              className="cv-glass-strong absolute left-0 right-0 top-[calc(100%+10px)] z-50 max-h-[26rem] overflow-y-auto rounded-3xl p-2 shadow-glass-hover"
            >
              {results.isLoading ? (
                <div className="space-y-2 p-2">
                  <LoadingSkeleton className="h-10 w-full" />
                  <LoadingSkeleton className="h-10 w-full" />
                  <LoadingSkeleton className="h-10 w-2/3" />
                </div>
              ) : results.isError ? (
                <div className="flex items-center gap-2.5 px-3 py-3 text-[13px] font-semibold text-rose-600">
                  <TriangleAlert size={15} className="shrink-0" />
                  <span>{results.error instanceof Error ? results.error.message : "Search failed"}</span>
                </div>
              ) : results.data ? (
                <>
                  {results.data.degraded ? (
                    <div className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-amber-600">
                      <TriangleAlert size={14} className="shrink-0" />
                      <span>Search is degraded{results.data.degraded_reason ? `: ${results.data.degraded_reason}` : ""}</span>
                    </div>
                  ) : null}
                  {results.data.hits.length === 0 ? (
                    <div className="flex items-center gap-2.5 px-3 py-3 text-[13px] text-cv-slate">
                      <SearchX size={15} className="shrink-0 text-cv-mist" />
                      <span>
                        No matches for <span className="font-semibold text-cv-ink">“{results.data.query}”</span>
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {results.data.hits.map((hit) => (
                        <SearchHitRow key={`${hit.entity_type}-${hit.id}`} hit={hit} compact onNavigate={() => setOpen(false)} />
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={goToResultsPage}
                    className="cv-ring-focus mt-1 flex w-full items-center justify-between rounded-2xl px-3 py-2 text-xs font-bold text-cv-blue transition hover:bg-white/70"
                  >
                    <span>Open full search{results.data.hits.length > 0 ? ` (${results.data.hits.length} shown)` : ""}</span>
                    <span className="text-cv-mist">{results.data.took_ms} ms</span>
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Ask Copilot */}
        <button
          type="button"
          onClick={toggleCopilot}
          aria-label="Open Copilot"
          className="cv-ring-focus group inline-flex shrink-0 items-center gap-2 rounded-full bg-cv-brand px-3.5 py-2.5 text-sm font-bold text-white shadow-button transition hover:-translate-y-0.5 sm:px-5"
        >
          <Sparkles size={16} className="transition group-hover:rotate-12" />
          <span className="hidden sm:inline">Ask Copilot</span>
        </button>

        {/* Notifications */}
        <button
          type="button"
          className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/70 text-cv-slate ring-1 ring-white/70 transition hover:text-cv-ink"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        {/* Profile */}
        <div className="flex shrink-0 items-center gap-2.5 rounded-full bg-white/70 py-1 pl-1 pr-1 ring-1 ring-white/70 sm:pr-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-blue-500 text-xs font-bold text-white">
            CV
          </span>
          <div className="hidden leading-tight sm:block">
            <p className="text-[13px] font-bold text-cv-ink">CompliVibe</p>
            <p className="text-[11px] text-cv-slate">Workspace</p>
          </div>
        </div>
      </div>
    </header>
  );
}
