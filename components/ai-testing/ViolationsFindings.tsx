"use client";

import { ListChecks, ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeRisks, isMitigated } from "@/lib/api/risk-normalizers";
import { normalizeIncidents, isResolved } from "@/lib/api/incident-normalizers";
import type { Severity } from "@/lib/api/types";
import type { AiTestingData } from "@/lib/hooks/useAiTesting";

const order: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
type Finding = { id: string; title: string; severity: Severity; hasSeverity: boolean; kind: "Risk" | "Incident" };

export function ViolationsFindings({ data }: { data: AiTestingData }) {
  const { risks, incidents } = data;

  const riskItems: Finding[] = normalizeRisks(risks.data)
    .filter((r) => !isMitigated(r.status))
    .map((r) => ({ id: `r-${r.id}`, title: r.title, severity: r.severity, hasSeverity: r.hasSeverity, kind: "Risk" }));
  const incItems: Finding[] = normalizeIncidents(incidents.data)
    .filter((i) => !isResolved(i.status))
    .map((i) => ({ id: `i-${i.id}`, title: i.title, severity: i.severity, hasSeverity: i.hasSeverity, kind: "Incident" }));
  const combined = [...riskItems, ...incItems].sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 8);

  const loading = risks.isLoading || incidents.isLoading;
  const errored = risks.isError && incidents.isError;

  return (
    <SectionCard title="Violations & Findings" subtitle="Open risks & incidents from backend" icon={ListChecks} accent="red" className="h-full">
      {loading ? (
        <SkeletonRows rows={5} />
      ) : errored ? (
        <ErrorState compact title="Unable to load findings" onRetry={() => risks.refetch()} />
      ) : combined.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No open findings returned" description="Open risks and incidents tied to AI systems will appear here once the backend reports them." />
      ) : (
        <ul className="space-y-2.5">
          {combined.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{f.title}</p>
                <p className="text-[11px] font-medium text-cv-mist">{f.kind}</p>
              </div>
              {f.hasSeverity ? <SeverityBadge severity={f.severity} /> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
