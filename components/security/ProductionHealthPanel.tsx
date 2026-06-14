"use client";

import { HeartPulse } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeHealth, healthTone } from "@/lib/api/security-normalizers";
import type { SecurityData } from "@/lib/hooks/useSecurity";

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/50 py-2.5 last:border-0">
      <span className="text-[12px] font-semibold text-cv-slate">{label}</span>
      {value ? <StatusBadge label={value} tone={healthTone(value)} /> : <span className="text-[12px] text-cv-mist">Unavailable</span>}
    </div>
  );
}

export function ProductionHealthPanel({ data }: { data: SecurityData }) {
  const { health, readiness, scan } = data;
  const h = normalizeHealth(health.data, readiness.data, scan.data);
  const loading = health.isLoading && readiness.isLoading && scan.isLoading;

  return (
    <SectionCard title="Production Health" subtitle="Service health & readiness" icon={HeartPulse} accent="teal" className="h-full">
      {loading ? (
        <SkeletonRows rows={4} />
      ) : !h.hasAny ? (
        <EmptyState icon={HeartPulse} title="Health data unavailable from backend." description="Service health, readiness, backup, monitoring, and scan status will appear here once those endpoints are available." />
      ) : (
        <div>
          <Row label="Service health" value={h.health} />
          <Row label="Production readiness" value={h.readiness} />
          <Row label="Backup" value={h.backup} />
          <Row label="Monitoring" value={h.monitoring} />
          <Row label="Security scan" value={h.scan} />
        </div>
      )}
    </SectionCard>
  );
}
