"use client";

import { Bot, Check, Sparkles, X } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { IconTile } from "@/components/ui/IconTile";
import { buildReason, categoryLabel, humanizeLabel, PRIORITY_ACCENT, PRIORITY_TONE } from "@/components/insights/reasoning";
import type { RecommendationWithSystem } from "@/lib/hooks/useInsights";
import type { UseMutationResult } from "@tanstack/react-query";
import type { AiRiskRecommendation } from "@/lib/api/insights";

const PRIORITY_ORDER = ["critical", "high", "medium", "low"];

type RecQuery = {
  isLoading: boolean;
  isError: boolean;
  data: RecommendationWithSystem[];
  refetch: () => void;
};

export function RecommendationsPanel({
  recommendations,
  applyMutation,
  dismissMutation
}: {
  recommendations: RecQuery;
  applyMutation: UseMutationResult<AiRiskRecommendation, unknown, string>;
  dismissMutation: UseMutationResult<AiRiskRecommendation, unknown, string>;
}) {
  const items = recommendations.data ?? [];
  const active = items
    .filter((r) => r.status === "active")
    .sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority) || b.priority_weight - a.priority_weight);
  const resolved = items.filter((r) => r.status !== "active");

  const counts = PRIORITY_ORDER.reduce<Record<string, number>>((acc, p) => {
    acc[p] = active.filter((r) => r.priority === p).length;
    return acc;
  }, {});

  return (
    <SectionCard
      title="AI Governance Recommendations"
      subtitle="Fanned out across every registered AI system: GET /ai-governance/systems/{id}/recommendations — apply turns a recommendation into a linked task, dismiss closes it out"
      icon={Sparkles}
      accent="purple"
      className="h-full"
      action={
        active.length > 0 ? (
          <div className="flex items-center gap-1.5">
            {PRIORITY_ORDER.filter((p) => counts[p] > 0).map((p) => (
              <StatusBadge key={p} label={`${counts[p]} ${p}`} tone={PRIORITY_TONE[p]} />
            ))}
          </div>
        ) : null
      }
    >
      {recommendations.isLoading ? (
        <SkeletonRows rows={5} />
      ) : recommendations.isError ? (
        <ErrorState
          title="Recommendations unavailable"
          description="One or more AI system recommendation queries failed."
          onRetry={() => recommendations.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No recommendations yet"
          description="No AI system has generated recommendations. They're created from monitoring breaches, risk assessments, and governance signals as they occur."
        />
      ) : (
        <div className="space-y-5">
          {active.length === 0 ? (
            <EmptyState compact icon={Check} title="All caught up" description="No active recommendations — everything has been applied or dismissed." />
          ) : (
            <ul className="space-y-2.5">
              {active.map((rec) => {
                const isApplying = applyMutation.isPending && applyMutation.variables === rec.id;
                const isDismissing = dismissMutation.isPending && dismissMutation.variables === rec.id;
                const busy = isApplying || isDismissing;
                const failedHere =
                  (applyMutation.isError && applyMutation.variables === rec.id) ||
                  (dismissMutation.isError && dismissMutation.variables === rec.id);
                return (
                  <li key={rec.id} className="rounded-2xl bg-white/55 px-3.5 py-3.5 ring-1 ring-white/70">
                    <div className="flex items-start gap-3">
                      <IconTile icon={Bot} accent={PRIORITY_ACCENT[rec.priority] ?? "purple"} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[13px] font-semibold leading-snug text-cv-ink">{rec.recommendation_text}</p>
                          <StatusBadge label={rec.priority} tone={PRIORITY_TONE[rec.priority] ?? "neutral"} />
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-cv-mist">
                          <span>{rec.system?.name ?? `System ${rec.ai_system_id.slice(0, 8)}`}</span>
                          <span aria-hidden="true">·</span>
                          <span>{categoryLabel(rec.recommendation_category)}</span>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-cv-slate">{buildReason(rec)}</p>
                        {rec.context_flags.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {rec.context_flags.map((flag) => (
                              <span
                                key={flag}
                                className="rounded-full bg-slate-400/10 px-2 py-0.5 text-[10px] font-semibold text-cv-slate ring-1 ring-slate-400/15"
                              >
                                {humanizeLabel(flag)}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {failedHere ? (
                          <p className="mt-2 text-[11px] font-semibold text-rose-600">
                            {(applyMutation.error instanceof Error && applyMutation.error.message) ||
                              (dismissMutation.error instanceof Error && dismissMutation.error.message) ||
                              "Action failed."}
                          </p>
                        ) : null}
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => applyMutation.mutate(rec.id)}
                            className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-3 py-1.5 text-[11.5px] font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Check size={12} />
                            {isApplying ? "Applying..." : "Apply"}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => dismissMutation.mutate(rec.id)}
                            className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11.5px] font-bold text-cv-ink ring-1 ring-white/70 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <X size={12} />
                            {isDismissing ? "Dismissing..." : "Dismiss"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {resolved.length > 0 ? (
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-cv-mist">
                Resolved ({resolved.length})
              </p>
              <ul className="space-y-1.5">
                {resolved.map((rec) => (
                  <li
                    key={rec.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white/40 px-3 py-2 text-xs ring-1 ring-white/50"
                  >
                    <span className="truncate text-cv-slate">{rec.recommendation_text}</span>
                    <StatusBadge label={rec.status} tone={rec.status === "applied" ? "good" : "neutral"} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </SectionCard>
  );
}
