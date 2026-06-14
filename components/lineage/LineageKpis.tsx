"use client";

import { Share2, GitBranch, ShieldAlert, Unlink } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { IconTile } from "@/components/ui/IconTile";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { cn } from "@/lib/utils/cn";
import type { Accent } from "@/components/ui/accent";
import type { DataLineage } from "@/lib/hooks/useDataLineage";

type Card = { label: string; icon: typeof Share2; accent: Accent; value: number; tone?: "default" | "warn" };

export function LineageKpis({ data }: { data: DataLineage }) {
  const { kpis, isLoading, isError } = data;

  const cards: Card[] = [
    { label: "Lineage nodes", icon: Share2, accent: "blue", value: kpis.nodes },
    { label: "Relationships", icon: GitBranch, accent: "purple", value: kpis.edges },
    { label: "Sensitive data signals", icon: ShieldAlert, accent: "red", value: kpis.sensitiveSignals },
    { label: "Broken / unknown links", icon: Unlink, accent: "amber", value: kpis.brokenLinks, tone: "warn" }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <GlassCard key={c.label} hover className="flex flex-col gap-4 p-5">
          <IconTile icon={c.icon} accent={c.accent} size="md" />
          <div>
            <p className="text-[13px] font-semibold text-cv-slate">{c.label}</p>
            {isLoading ? (
              <LoadingSkeleton className="mt-2 h-9 w-20" />
            ) : isError ? (
              <p className="mt-1.5">
                <span className="inline-flex items-center rounded-full bg-slate-400/10 px-2 py-0.5 text-[11px] font-semibold text-cv-slate ring-1 ring-slate-400/15">
                  Unavailable
                </span>
              </p>
            ) : (
              <p className="mt-1 flex items-baseline gap-1">
                <span
                  className={cn(
                    "text-[34px] font-extrabold leading-none tracking-tight",
                    c.tone === "warn" && c.value > 0 ? "text-amber-600" : "text-cv-ink"
                  )}
                >
                  {c.value.toLocaleString()}
                </span>
              </p>
            )}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
