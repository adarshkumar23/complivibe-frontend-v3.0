"use client";

import { BarChart3 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeScoreComponents } from "@/lib/api/score-explainer-normalizers";
import { scoreTone } from "@/lib/utils/format";
import type { ScoreExplainerData } from "@/lib/hooks/useScoreExplainer";

const toneBar = { good: "#10B981", warn: "#F59E0B", bad: "#EF4444" } as const;

export function ScoreBreakdown({ data }: { data: ScoreExplainerData }) {
  const { scores, unified, executive, overview, governance, aiGovernance, explain, scoreLoading } = data;
  const c = normalizeScoreComponents(scores.data, unified.data, executive.data, overview.data, governance.data, aiGovernance.data, explain.data);

  const rows: { label: string; value: number | null }[] = [
    { label: "Governance", value: c.governance },
    { label: "Compliance", value: c.compliance },
    { label: "Evidence", value: c.evidence },
    { label: "Risk posture", value: c.risk },
    { label: "Incident posture", value: c.incident },
    { label: "Audit readiness", value: c.auditReadiness },
    { label: "Trust center readiness", value: c.trustCenterReadiness },
    { label: "Certification readiness", value: c.certificationReadiness },
    { label: "AI system readiness", value: c.aiSystemReadiness }
  ].filter((r) => r.value != null);

  return (
    <SectionCard title="Score Breakdown" subtitle="Backend-provided score components" icon={BarChart3} accent="blue" className="h-full">
      {scoreLoading ? (
        <SkeletonRows rows={5} />
      ) : !c.hasAny || rows.length === 0 ? (
        <EmptyState icon={BarChart3} title="Score breakdown unavailable from backend." description="Individual score components will appear here once the backend returns them. No formula is invented." />
      ) : (
        <ul className="space-y-3.5">
          {rows.map((r) => {
            const tone = scoreTone(r.value);
            return (
              <li key={r.label}>
                <div className="mb-1.5 flex items-center justify-between text-[13px]">
                  <span className="font-semibold text-cv-ink">{r.label}</span>
                  <span className="font-bold text-cv-ink">{Math.round(r.value as number)}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-400/12">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(4, Math.min(100, r.value as number))}%`, background: toneBar[tone] }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
