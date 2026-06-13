"use client";

import { Link2, Cpu, FileCheck2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeRisks } from "@/lib/api/risk-normalizers";
import { normalizeAiSystems } from "@/lib/api/ai-system-normalizers";
import { normalizeEvidenceItems } from "@/lib/api/evidence-normalizers";
import type { RisksData } from "@/lib/hooks/useRisks";

export function LinkedEvidenceSystems({ data }: { data: RisksData }) {
  const { risks, aiSystems, evidence } = data;
  const list = normalizeRisks(risks.data);

  const systemMap = new Map<string, string>();
  normalizeAiSystems(aiSystems.data).forEach((s) => s.rawId && systemMap.set(s.rawId, s.name));
  const evidenceMap = new Map<string, string>();
  normalizeEvidenceItems(evidence.data).forEach((e) => e.rawId && evidenceMap.set(e.rawId, e.title));

  const withSystem = list.filter((r) => r.aiSystem);
  const withEvidence = list.filter((r) => r.evidenceRef);
  const linked = list.filter((r) => r.aiSystem || r.evidenceRef).slice(0, 4);

  const resolve = (ref: string | null, map: Map<string, string>) => (ref ? map.get(ref) || ref : null);

  return (
    <SectionCard title="Linked Evidence & Systems" subtitle="Traceability of risks" icon={Link2} accent="cyan">
      {risks.isLoading ? (
        <SkeletonRows rows={3} />
      ) : risks.isError ? (
        <ErrorState compact title="Unable to load risks" onRetry={() => risks.refetch()} />
      ) : list.length === 0 || (withSystem.length === 0 && withEvidence.length === 0) ? (
        <EmptyState compact icon={Link2} title="No linked records" description="Links to AI systems and evidence appear here when risks carry those references." />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex items-center gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
              <IconTile icon={Cpu} accent="blue" size="sm" />
              <div>
                <p className="text-lg font-extrabold leading-none text-cv-ink">{withSystem.length}</p>
                <p className="mt-0.5 text-[11px] font-medium text-cv-slate">Linked to systems</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
              <IconTile icon={FileCheck2} accent="green" size="sm" />
              <div>
                <p className="text-lg font-extrabold leading-none text-cv-ink">{withEvidence.length}</p>
                <p className="mt-0.5 text-[11px] font-medium text-cv-slate">Linked to evidence</p>
              </div>
            </div>
          </div>
          {linked.length > 0 ? (
            <ul className="space-y-2">
              {linked.map((r) => (
                <li key={r.id} className="rounded-xl bg-white/50 px-3 py-2 ring-1 ring-white/60">
                  <p className="truncate text-[13px] font-semibold text-cv-ink">{r.title}</p>
                  <p className="truncate text-[11px] text-cv-slate">
                    {[resolve(r.aiSystem, systemMap), resolve(r.evidenceRef, evidenceMap)].filter(Boolean).join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </SectionCard>
  );
}
