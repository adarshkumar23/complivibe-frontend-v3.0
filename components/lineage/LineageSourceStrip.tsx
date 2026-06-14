"use client";

import { cn } from "@/lib/utils/cn";
import type { SourceStatus } from "@/lib/hooks/useDataLineage";

const DOT: Record<SourceStatus["status"], string> = {
  loading: "bg-slate-300",
  available: "bg-emerald-500",
  unavailable: "bg-rose-500"
};

export function LineageSourceStrip({ statuses }: { statuses: SourceStatus[] }) {
  const available = statuses.filter((s) => s.status === "available").length;
  const unavailable = statuses.filter((s) => s.status === "unavailable").length;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/45 px-3 py-2 ring-1 ring-white/60">
      <span className="text-[11px] font-bold uppercase tracking-wide text-cv-mist">Sources</span>
      <span className="text-[11px] font-semibold text-emerald-600">{available} connected</span>
      {unavailable > 0 ? <span className="text-[11px] font-semibold text-rose-600">· {unavailable} unavailable</span> : null}
      <div className="ml-1 flex flex-wrap items-center gap-1.5">
        {statuses.map((s) => (
          <span
            key={s.id}
            title={`${s.label}: ${s.status}`}
            className={cn(
              "inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-semibold ring-1 ring-white/70",
              s.status === "unavailable" ? "text-cv-mist" : "text-cv-slate"
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", DOT[s.status])} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
