"use client";

import { Search, Bell, Sparkles, Menu } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useUiStore } from "@/store/ui-store";

export function Topbar() {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

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
        <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-full bg-white/55 px-4 py-2.5 ring-1 ring-white/70 focus-within:ring-cv-blue/40">
          <Search size={17} className="shrink-0 text-cv-mist" />
          <input
            type="text"
            placeholder="Ask Copilot or search..."
            className="min-w-0 flex-1 bg-transparent text-sm text-cv-ink placeholder:text-cv-mist focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold text-cv-mist ring-1 ring-slate-200/70 sm:inline-block">
            ⌘K
          </kbd>
        </div>

        {/* Ask Copilot */}
        <button
          type="button"
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
