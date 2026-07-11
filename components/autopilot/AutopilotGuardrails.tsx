"use client";

import { ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import type { AutopilotData } from "@/lib/hooks/useAutopilot";

/** Resolved permission surface from GET /api/v1/ai-governance/autopilot/summary. */
export function AutopilotGuardrails({ data }: { data: AutopilotData }) {
  const { summary } = data;
  const s = summary.data;

  const rows = s
    ? [
        { label: "External effects", allowed: s.external_effects_allowed },
        { label: "Task creation", allowed: s.task_creation_allowed },
        { label: "Review creation", allowed: s.review_creation_allowed },
        { label: "Source record mutation", allowed: s.source_record_mutation_allowed }
      ]
    : [];

  return (
    <SectionCard
      title="Autopilot Guardrails"
      subtitle={s ? `Policy source: ${s.resolved_source.replaceAll("_", " ")}` : "Resolved permission surface"}
      icon={ShieldCheck}
      accent="teal"
    >
      {summary.isLoading ? (
        <SkeletonRows rows={4} />
      ) : summary.isError ? (
        <ErrorState compact title="Unable to load guardrails" onRetry={() => summary.refetch()} />
      ) : (
        <ul className="space-y-2.5">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <span className="text-[13px] font-semibold text-cv-ink">{r.label}</span>
              <StatusBadge label={r.allowed ? "Allowed" : "Blocked"} tone={r.allowed ? "warn" : "good"} />
            </li>
          ))}
          {s ? (
            <p className="pt-1 text-[10px] leading-relaxed text-cv-mist">
              Blocked is the safe state: autopilot plans actions but cannot execute them without explicit policy grants
              and human approval.
            </p>
          ) : null}
        </ul>
      )}
    </SectionCard>
  );
}
