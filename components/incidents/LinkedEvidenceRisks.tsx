"use client";

import { Link2, TriangleAlert, FileCheck2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeIncidents } from "@/lib/api/incident-normalizers";
import { normalizeRisks } from "@/lib/api/risk-normalizers";
import { normalizeEvidenceItems } from "@/lib/api/evidence-normalizers";
import type { IncidentsData } from "@/lib/hooks/useIncidents";

export function LinkedEvidenceRisks({ data }: { data: IncidentsData }) {
  const { incidents, risks, evidence } = data;
  const list = normalizeIncidents(incidents.data);

  const riskMap = new Map<string, string>();
  normalizeRisks(risks.data).forEach((r) => r.rawId && riskMap.set(r.rawId, r.title));
  const evidenceMap = new Map<string, string>();
  normalizeEvidenceItems(evidence.data).forEach((e) => e.rawId && evidenceMap.set(e.rawId, e.title));

  const withRisk = list.filter((i) => i.riskRef);
  const withEvidence = list.filter((i) => i.evidenceRef);
  const linked = list.filter((i) => i.riskRef || i.evidenceRef).slice(0, 4);
  const resolve = (ref: string | null, map: Map<string, string>) => (ref ? map.get(ref) || ref : null);

  return (
    <SectionCard title="Linked Evidence & Risks" subtitle="Incident traceability" icon={Link2} accent="cyan">
      {incidents.isLoading ? (
        <SkeletonRows rows={3} />
      ) : incidents.isError ? (
        <ErrorState compact title="Unable to load incidents" onRetry={() => incidents.refetch()} />
      ) : list.length === 0 || (withRisk.length === 0 && withEvidence.length === 0) ? (
        <EmptyState compact icon={Link2} title="No linked records" description="Links to risks and evidence appear here when incidents carry those references." />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex items-center gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
              <IconTile icon={TriangleAlert} accent="red" size="sm" />
              <div>
                <p className="text-lg font-extrabold leading-none text-cv-ink">{withRisk.length}</p>
                <p className="mt-0.5 text-[11px] font-medium text-cv-slate">Linked to risks</p>
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
              {linked.map((i) => (
                <li key={i.id} className="rounded-xl bg-white/50 px-3 py-2 ring-1 ring-white/60">
                  <p className="truncate text-[13px] font-semibold text-cv-ink">{i.title}</p>
                  <p className="truncate text-[11px] text-cv-slate">
                    {[resolve(i.riskRef, riskMap), resolve(i.evidenceRef, evidenceMap)].filter(Boolean).join(" · ")}
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
