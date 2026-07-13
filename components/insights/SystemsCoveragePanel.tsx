"use client";

import { RefreshCw, Zap } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import type { AiSystem } from "@/lib/api/ai-systems";
import type { RecommendationWithSystem } from "@/lib/hooks/useInsights";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import type { AiRiskRecommendation } from "@/lib/api/insights";

/**
 * Every registered AI system and whether it currently has recommendations — with a
 * real "Generate" action (POST /ai-governance/systems/{id}/generate-recommendations)
 * for systems that don't have any yet.
 */
export function SystemsCoveragePanel({
  systems,
  recommendations,
  generateMutation
}: {
  systems: UseQueryResult<AiSystem[], unknown>;
  recommendations: { data: RecommendationWithSystem[] };
  generateMutation: UseMutationResult<AiRiskRecommendation[], unknown, string>;
}) {
  const items = systems.data ?? [];
  const countBySystem = new Map<string, number>();
  for (const rec of recommendations.data) {
    if (rec.status === "active") {
      countBySystem.set(rec.ai_system_id, (countBySystem.get(rec.ai_system_id) ?? 0) + 1);
    }
  }

  return (
    <SectionCard
      title="AI System Coverage"
      subtitle="GET /api/v1/ai-governance/systems — generate a fresh recommendation pass for any system"
      icon={Zap}
      accent="teal"
    >
      {systems.isLoading ? (
        <SkeletonRows rows={3} />
      ) : systems.isError ? (
        <ErrorState compact title="Systems unavailable" onRetry={() => systems.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState compact title="No AI systems registered" description="Register an AI system to start generating governance recommendations." />
      ) : (
        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((system) => {
            const count = countBySystem.get(system.id) ?? 0;
            const isGenerating = generateMutation.isPending && generateMutation.variables === system.id;
            const failedHere = generateMutation.isError && generateMutation.variables === system.id;
            return (
              <li key={system.id} className="flex flex-col gap-2 rounded-2xl bg-white/50 px-3.5 py-3 ring-1 ring-white/60">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-[13px] font-semibold text-cv-ink">{system.name}</p>
                  <StatusBadge label={count > 0 ? `${count} active` : "none"} tone={count > 0 ? "warn" : "neutral"} />
                </div>
                <p className="text-[11px] text-cv-mist">{system.lifecycle_status.replaceAll("_", " ")}</p>
                {failedHere ? (
                  <p className="text-[11px] font-semibold text-rose-600">
                    {generateMutation.error instanceof Error ? generateMutation.error.message : "Generation failed."}
                  </p>
                ) : null}
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => generateMutation.mutate(system.id)}
                  className="cv-ring-focus mt-auto inline-flex items-center justify-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11.5px] font-bold text-cv-ink ring-1 ring-white/70 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw size={12} className={isGenerating ? "animate-spin" : undefined} />
                  {isGenerating ? "Generating..." : "Generate recommendations"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
