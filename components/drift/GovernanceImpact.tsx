"use client";

import { Scale, ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeRisks, isMitigated } from "@/lib/api/risk-normalizers";
import { normalizeIncidents, isResolved } from "@/lib/api/incident-normalizers";
import type { Severity } from "@/lib/api/types";
import type { DriftData } from "@/lib/hooks/useDrift";

const order: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
type Item = { id: string; title: string; severity: Severity; hasSeverity: boolean; kind: "Risk" | "Incident" };

export function GovernanceImpact({ data }: { data: DriftData }) {
  const { risks, incidents } = data;

  const riskItems: Item[] = normalizeRisks(risks.data)
    .filter((r) => !isMitigated(r.status))
    .map((r) => ({ id: `r-${r.id}`, title: r.title, severity: r.severity, hasSeverity: r.hasSeverity, kind: "Risk" }));
  const incItems: Item[] = normalizeIncidents(incidents.data)
    .filter((i) => !isResolved(i.status))
    .map((i) => ({ id: `i-${i.id}`, title: i.title, severity: i.severity, hasSeverity: i.hasSeverity, kind: "Incident" }));
  const combined = [...riskItems, ...incItems].sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 8);

  const loading = risks.isLoading || incidents.isLoading;
  const errored = risks.isError && incidents.isError;

  return (
    <SectionCard title="Governance Impact" subtitle="Open risks & incidents linked to drift" icon={Scale} accent="red" className="h-full">
      {loading ? (
        <SkeletonRows rows={4} />
      ) : errored || combined.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Governance impact mapping unavailable from backend." description="Risks and incidents that drift may affect will appear here once the backend reports them." />
      ) : (
        <ul className="space-y-2.5">
          {combined.map((it) => (
            <li key={it.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{it.title}</p>
                <p className="text-[11px] font-medium text-cv-mist">{it.kind}</p>
              </div>
              {it.hasSeverity ? <SeverityBadge severity={it.severity} /> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
