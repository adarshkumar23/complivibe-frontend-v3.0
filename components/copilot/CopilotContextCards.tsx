"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { CopilotContextCard } from "@/lib/hooks/useCopilot";

export function CopilotContextCards({ cards }: { cards: CopilotContextCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.map((c) => (
        <Link
          key={c.id}
          href={c.href}
          className={cn(
            "group rounded-2xl bg-white/55 p-3 ring-1 ring-white/70 outline-none transition",
            "hover:bg-white/85 focus-visible:ring-2 focus-visible:ring-cv-blue"
          )}
        >
          <div className="flex items-start justify-between gap-1">
            <span className="text-[11px] font-semibold leading-tight text-cv-slate">{c.label}</span>
            <ArrowUpRight size={13} className="text-cv-mist transition group-hover:text-cv-ink" />
          </div>
          <div className="mt-1">
            {c.status === "loading" ? (
              <span className="text-[18px] font-extrabold text-cv-mist">…</span>
            ) : c.status === "unavailable" ? (
              <span className="inline-flex items-center rounded-full bg-slate-400/10 px-2 py-0.5 text-[10px] font-semibold text-cv-slate ring-1 ring-slate-400/15">
                Unavailable
              </span>
            ) : c.count != null ? (
              <span className="text-[20px] font-extrabold leading-none text-cv-ink">{c.count.toLocaleString()}</span>
            ) : (
              <span className="text-[12px] font-bold text-cv-slate">Available</span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
