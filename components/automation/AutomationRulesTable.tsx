"use client";

import { Zap, PlusCircle } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import type { AutomationData } from "@/lib/hooks/useAutomation";

/** Automation rules from GET /api/v1/automation/rules. */
export function AutomationRulesTable({ data }: { data: AutomationData }) {
  const { rules } = data;
  const list = rules.data ?? [];

  return (
    <SectionCard
      title="Automation Rules"
      subtitle="Trigger → action rules the platform runs for you"
      icon={Zap}
      accent="blue"
      className="h-full"
      action={
        rules.isSuccess ? (
          <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
            {list.length} rules
          </span>
        ) : null
      }
    >
      {rules.isLoading ? (
        <SkeletonRows rows={5} />
      ) : rules.isError ? (
        <ErrorState title="Unable to load rules" onRetry={() => rules.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={PlusCircle}
          title="No automation rules"
          description="Create a rule to automate evidence collection, reminders, and issue triage."
        />
      ) : (
        <ul className="space-y-2.5">
          {list.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold leading-snug text-cv-ink">
                  {(r.name as string) || (r.title as string) || "Unnamed rule"}
                </p>
                <p className="mt-0.5 text-[11px] text-cv-slate">
                  {[r.trigger_type, r.action_type].filter(Boolean).map(String).join(" → ").replaceAll("_", " ")}
                </p>
              </div>
              {r.status ? (
                <StatusBadge label={String(r.status)} tone={r.status === "active" ? "good" : "neutral"} />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
