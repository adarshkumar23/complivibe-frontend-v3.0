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
import type { AuditPackData } from "@/lib/hooks/useAuditPack";

const order: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

type Issue = { id: string; title: string; severity: Severity; hasSeverity: boolean; kind: "Risk" | "Incident" };

export function IssuesToResolve({ data }: { data: AuditPackData }) {
  const { risks, incidents } = data;

  const riskItems: Issue[] = normalizeRisks(risks.data)
    .filter((r) => !isMitigated(r.status))
    .map((r) => ({ id: `r-${r.id}`, title: r.title, severity: r.severity, hasSeverity: r.hasSeverity, kind: "Risk" }));
  const incItems: Issue[] = normalizeIncidents(incidents.data)
    .filter((i) => !isResolved(i.status))
    .map((i) => ({ id: `i-${i.id}`, title: i.title, severity: i.severity, hasSeverity: i.hasSeverity, kind: "Incident" }));

  const combined = [...riskItems, ...incItems].sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 6);

  const loading = risks.isLoading || incidents.isLoading;
  const errored = risks.isError && incidents.isError;

  return (
    <SectionCard title="Issues to Resolve" subtitle="Open risks & incidents" icon={ListChecks} accent="red">
      {loading ? (
        <SkeletonRows rows={4} />
      ) : errored ? (
        <ErrorState compact title="Unable to load issues" onRetry={() => risks.refetch()} />
      ) : combined.length === 0 ? (
        <EmptyState compact icon={ShieldCheck} title="No open issues returned by backend" description="Open risks and incidents that should be resolved before delivery will appear here." />
      ) : (
        <ul className="space-y-2.5">
          {combined.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{item.title}</p>
                <p className="text-[11px] font-medium text-cv-mist">{item.kind}</p>
              </div>
              {item.hasSeverity ? <SeverityBadge severity={item.severity} /> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
