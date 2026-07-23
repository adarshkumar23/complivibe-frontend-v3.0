"use client";

import { usePlan } from "@/lib/hooks/usePlan";

type Resource = "policies" | "controls" | "evidence" | "risks";

/**
 * Gentle "3 of 5 used" chip for a capped core resource. Renders ONLY when the
 * plan caps this resource (Free) -- uncapped tiers (trial/paid) have no
 * record_caps entry, so this returns null and adds no noise for entitled users.
 */
export function ResourceUsageChip({ resource, label }: { resource: Resource; label?: string }) {
  const { recordCaps, recordUsage } = usePlan();
  const cap = recordCaps?.[resource];
  if (typeof cap !== "number") return null; // uncapped tier -> nothing
  const used = recordUsage?.[resource] ?? 0;
  const atCap = used >= cap;
  return (
    <span
      data-testid={`usage-chip-${resource}`}
      title={atCap ? "You've reached the Free-plan limit — upgrade to add more" : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${
        atCap ? "bg-amber-500/12 text-amber-700 ring-amber-400/30" : "bg-white/60 text-cv-slate ring-white/70"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${atCap ? "bg-amber-500" : "bg-cv-blue"}`} />
      {used} of {cap} {label ?? resource} used
    </span>
  );
}
