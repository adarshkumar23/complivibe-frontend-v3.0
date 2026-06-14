"use client";

import { Rocket, AlertTriangle } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeReadiness, healthTone } from "@/lib/api/enterprise-normalizers";
import type { EnterpriseData } from "@/lib/hooks/useEnterpriseControl";

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/50 py-2.5 last:border-0">
      <span className="text-[12px] font-semibold text-cv-slate">{label}</span>
      {value ? <StatusBadge label={value} tone={healthTone(value)} /> : <span className="text-[12px] text-cv-mist">Unavailable</span>}
    </div>
  );
}

export function ProductionReadinessPanel({ data }: { data: EnterpriseData }) {
  const { readiness, health, summary } = data;
  const r = normalizeReadiness(readiness.data, health.data, summary.data);
  const loading = readiness.isLoading && health.isLoading && summary.isLoading;

  return (
    <SectionCard title="Production Readiness" subtitle="Service health, gates & warnings" icon={Rocket} accent="teal" className="h-full">
      {loading ? (
        <SkeletonRows rows={4} />
      ) : !r.hasAny ? (
        <EmptyState icon={Rocket} title="Production readiness data unavailable from backend." description="Health, readiness, backup, monitoring, and gate results will appear here once those endpoints are available." />
      ) : (
        <div>
          <Row label="Service health" value={r.health} />
          <Row label="Readiness" value={r.readiness} />
          <Row label="Backup" value={r.backup} />
          <Row label="Monitoring" value={r.monitoring} />
          <Row label="Security scan" value={r.scan} />
          <Row label="Last gate result" value={r.lastGate} />
          {r.warnings.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {r.warnings.slice(0, 8).map((w, i) => (
                <li key={i} className="flex items-start gap-2 rounded-xl bg-amber-400/10 px-3 py-2 text-[12px] font-medium text-amber-700 ring-1 ring-amber-400/20">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" /> <span className="min-w-0">{w}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </SectionCard>
  );
}
