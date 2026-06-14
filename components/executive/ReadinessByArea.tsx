"use client";

import { Gauge } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeScoreComponents } from "@/lib/api/executive-normalizers";
import { scoreTone } from "@/lib/utils/format";
import type { ExecutiveSummaryData } from "@/lib/hooks/useExecutiveSummary";

const toneBar = { good: "#10B981", warn: "#F59E0B", bad: "#EF4444" } as const;

export function ReadinessByArea({ data }: { data: ExecutiveSummaryData }) {
  const { executive, scores, unified, overview, complianceScore, governance, aiGovernance, scoreLoading } = data;
  const c = normalizeScoreComponents(executive.data, scores.data, unified.data, overview.data, complianceScore.data, governance.data, aiGovernance.data);

  const areas: { label: string; value: number | null }[] = [
    { label: "AI governance", value: c.governance },
    { label: "Compliance", value: c.compliance },
    { label: "Evidence", value: c.evidence },
    { label: "Risk posture", value: c.risk },
    { label: "Incidents", value: c.incident },
    { label: "Audit readiness", value: c.auditReadiness },
    { label: "Trust center", value: c.trustCenterReadiness },
    { label: "Certifications", value: c.certificationReadiness }
  ];

  return (
    <SectionCard title="Readiness by Area" subtitle="Backend score components" icon={Gauge} accent="teal" className="h-full">
      {scoreLoading ? (
        <SkeletonRows rows={5} />
      ) : !c.hasAny ? (
        <EmptyState icon={Gauge} title="Area readiness unavailable from backend." description="Per-area score components will appear here once the backend returns them." />
      ) : (
        <ul className="space-y-3">
          {areas.map((a) => {
            const tone = scoreTone(a.value);
            return (
              <li key={a.label}>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span className="font-semibold text-cv-ink">{a.label}</span>
                  {a.value != null ? <span className="font-bold text-cv-ink">{Math.round(a.value)}</span> : <span className="text-[11px] text-cv-mist">Unavailable</span>}
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-400/12">
                  {a.value != null ? (
                    <div className="h-full rounded-full" style={{ width: `${Math.max(4, Math.min(100, a.value))}%`, background: toneBar[tone] }} />
                  ) : (
                    <div className="h-full w-full bg-[repeating-linear-gradient(90deg,rgba(148,163,184,0.25)_0_8px,transparent_8px_16px)]" />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
