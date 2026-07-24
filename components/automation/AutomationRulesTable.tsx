"use client";

import { Zap, PlusCircle, Pencil } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { useHasPermission } from "@/lib/hooks/usePermissions";
import type { AutomationData } from "@/lib/hooks/useAutomation";
import type { AutomationRule } from "@/lib/api/automation";

/** Automation rules from GET /api/v1/automation/rules. */
export function AutomationRulesTable({
  data,
  onCreate,
  onEdit
}: {
  data: AutomationData;
  onCreate?: () => void;
  onEdit?: (rule: AutomationRule) => void;
}) {
  const { rules } = data;
  const list = rules.data ?? [];
  // Create/edit require automation:write (the backend enforces the same).
  const canWrite = useHasPermission("automation:write");

  return (
    <SectionCard
      title="Automation Rules"
      subtitle="Trigger → action rules the platform runs for you"
      icon={Zap}
      accent="blue"
      className="h-full"
      action={
        canWrite && onCreate ? (
          <button
            type="button"
            data-testid="new-automation-rule"
            onClick={onCreate}
            className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-3 py-1.5 text-[11px] font-bold text-white shadow-button transition hover:-translate-y-0.5"
          >
            <PlusCircle size={12} strokeWidth={2.6} /> New rule
          </button>
        ) : rules.isSuccess ? (
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
        <div className="flex flex-col items-center gap-3">
          <EmptyState
            icon={PlusCircle}
            title="No automation rules"
            description="Create a rule to automate evidence collection, reminders, and issue triage."
          />
          {canWrite && onCreate ? (
            <button
              type="button"
              data-testid="new-automation-rule-empty"
              onClick={onCreate}
              className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-4 py-2 text-xs font-bold text-white shadow-button transition hover:-translate-y-0.5"
            >
              <PlusCircle size={13} strokeWidth={2.6} /> New rule
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="space-y-2.5">
          {list.map((r) => (
            <li key={r.id} data-testid={`automation-rule-${r.id}`} className="flex items-start justify-between gap-3 rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold leading-snug text-cv-ink">
                  {(r.name as string) || (r.title as string) || "Unnamed rule"}
                </p>
                <p className="mt-0.5 text-[11px] text-cv-slate">
                  {[r.trigger_type, r.action_type].filter(Boolean).map(String).join(" → ").replaceAll("_", " ")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {r.status ? (
                  <StatusBadge label={String(r.status)} tone={r.status === "active" ? "good" : "neutral"} />
                ) : null}
                {canWrite && onEdit ? (
                  <button
                    type="button"
                    aria-label="Edit rule"
                    data-testid={`automation-edit-${r.id}`}
                    onClick={() => onEdit(r)}
                    className="cv-ring-focus inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/60 text-cv-slate ring-1 ring-white/70 transition hover:bg-white hover:text-cv-ink"
                  >
                    <Pencil size={11} strokeWidth={2.4} />
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
