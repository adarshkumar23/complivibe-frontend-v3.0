"use client";

import Link from "next/link";
import {
  Brain,
  FileCheck2,
  TriangleAlert,
  FileBarChart,
  Share2,
  Briefcase,
  ArrowUpRight,
  type LucideIcon
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { IconTile } from "@/components/ui/IconTile";
import { cn } from "@/lib/utils/cn";
import type { Accent } from "@/components/ui/accent";

type Action = { label: string; icon: LucideIcon; href: string; accent: Accent };

const ACTIONS: Action[] = [
  { label: "View AI Systems", icon: Brain, href: "/dashboard/ai-systems", accent: "purple" },
  { label: "View Evidence", icon: FileCheck2, href: "/dashboard/evidence", accent: "blue" },
  { label: "View Risks", icon: TriangleAlert, href: "/dashboard/risks", accent: "amber" },
  { label: "View Reports", icon: FileBarChart, href: "/dashboard/reports", accent: "cyan" },
  { label: "View Trust Graph", icon: Share2, href: "/dashboard/trust-graph", accent: "teal" },
  { label: "View Executive Summary", icon: Briefcase, href: "/dashboard/executive", accent: "green" }
];

export function QuickActions() {
  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold leading-tight text-cv-ink">Start Exploring</h3>
          <p className="mt-0.5 text-xs text-cv-slate">Jump straight into the seeded demo workspace.</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={cn(
              "group flex items-center gap-3 rounded-2xl bg-white/55 p-3 ring-1 ring-white/70 outline-none transition",
              "hover:bg-white/85 hover:shadow-glass-hover",
              "focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            )}
          >
            <IconTile icon={action.icon} accent={action.accent} size="sm" />
            <span className="flex-1 text-[12px] font-semibold leading-tight text-cv-ink">{action.label}</span>
            <ArrowUpRight size={15} className="text-cv-mist transition group-hover:text-cv-ink" />
          </Link>
        ))}
      </div>
    </GlassCard>
  );
}
