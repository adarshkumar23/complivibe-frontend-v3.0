"use client";

import { useMemo } from "react";
import { Cpu, FileCheck2, TriangleAlert } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeAiSystems } from "@/lib/api/ai-system-normalizers";
import { normalizeEvidenceItems } from "@/lib/api/evidence-normalizers";
import { normalizeRisks, isMitigated } from "@/lib/api/risk-normalizers";
import type { ScoreExplainerData } from "@/lib/hooks/useScoreExplainer";

export function AiSystemCoverage({ data }: { data: ScoreExplainerData }) {
  const { aiSystems, evidence, risks } = data;

  const rows = useMemo(() => {
    if (!aiSystems.isSuccess) return [];
    const systems = normalizeAiSystems(aiSystems.data);
    const evItems = evidence.isSuccess ? normalizeEvidenceItems(evidence.data) : [];
    const riskItems = risks.isSuccess ? normalizeRisks(risks.data) : [];

    return systems.map((s) => {
      const keys = [s.name?.toLowerCase(), s.rawId?.toLowerCase()].filter(Boolean) as string[];
      const matches = (ref: string | null) => ref != null && keys.includes(ref.toLowerCase());
      const evidenceCount = evItems.filter((e) => matches(e.aiSystem)).length;
      const openRisks = riskItems.filter((r) => matches(r.aiSystem) && !isMitigated(r.status)).length;
      return { id: s.id, name: s.name, owner: s.owner, evidenceCount, openRisks };
    });
  }, [aiSystems.isSuccess, aiSystems.data, evidence.isSuccess, evidence.data, risks.isSuccess, risks.data]);

  return (
    <SectionCard
      title="AI System Coverage"
      subtitle="Evidence & open risks per system (derived from real links)"
      icon={Cpu}
      accent="purple"
    >
      {aiSystems.isLoading ? (
        <SkeletonRows rows={5} />
      ) : aiSystems.isError ? (
        <EmptyState icon={Cpu} title="AI system coverage unavailable" description="The AI systems endpoint is not available on this backend yet." />
      ) : rows.length === 0 ? (
        <EmptyState icon={Cpu} title="No AI systems returned" description="Per-system evidence and risk coverage will appear here once the backend returns AI systems." />
      ) : (
        <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {rows.slice(0, 12).map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
              <div className="flex min-w-0 items-center gap-3">
                <IconTile icon={Cpu} accent="blue" size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-cv-ink">{r.name}</p>
                  {r.owner ? <p className="truncate text-[11px] text-cv-slate">{r.owner}</p> : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-[11px] font-semibold">
                <span className="inline-flex items-center gap-1 text-emerald-600"><FileCheck2 size={12} /> {r.evidenceCount}</span>
                <span className="inline-flex items-center gap-1 text-amber-600"><TriangleAlert size={12} /> {r.openRisks}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
