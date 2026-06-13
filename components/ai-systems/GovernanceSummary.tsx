"use client";

import { Gauge } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { ScoreRing } from "@/components/charts/ScoreRing";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { pickScore } from "@/lib/hooks/useCommandCenter";
import { normalizeAiSystems, averageScore } from "@/lib/api/ai-system-normalizers";
import type { AiSystemsData } from "@/lib/hooks/useAiSystems";

export function GovernanceSummary({ data }: { data: AiSystemsData }) {
  const { systems, governanceSummary, governanceScore } = data;
  const list = normalizeAiSystems(systems.data);

  const score =
    pickScore(
      [governanceScore.data, governanceSummary.data],
      ["governance_score", "ai_governance_score", "overall_score", "score", "average_score"]
    ) ?? averageScore(list);

  const total = systems.isSuccess ? list.length : null;
  const highRisk = systems.isSuccess
    ? list.filter((s) => s.riskLevel === "critical" || s.riskLevel === "high").length
    : null;

  const loading = governanceScore.isLoading && governanceSummary.isLoading && systems.isLoading;
  const errored = governanceScore.isError && governanceSummary.isError && systems.isError;

  return (
    <SectionCard title="Governance Summary" subtitle="AI governance posture" icon={Gauge} accent="purple">
      {loading ? (
        <LoadingSkeleton className="mx-auto h-36 w-40 rounded-2xl" />
      ) : errored ? (
        <ErrorState compact title="Unable to load summary" onRetry={() => governanceScore.refetch()} />
      ) : (
        <div className="flex flex-col items-center gap-4">
          <ScoreRing value={score} size={130} label="Governance" />
          <div className="grid w-full grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/50 px-3 py-2.5 text-center ring-1 ring-white/60">
              <p className="text-lg font-extrabold text-cv-ink">{total != null ? total : "—"}</p>
              <p className="text-[11px] font-medium text-cv-slate">Systems</p>
            </div>
            <div className="rounded-xl bg-white/50 px-3 py-2.5 text-center ring-1 ring-white/60">
              <p className="text-lg font-extrabold text-cv-ink">{highRisk != null ? highRisk : "—"}</p>
              <p className="text-[11px] font-medium text-cv-slate">High risk</p>
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
