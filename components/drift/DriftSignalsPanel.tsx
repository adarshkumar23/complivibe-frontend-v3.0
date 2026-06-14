"use client";

import { Radar } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeDriftSignals } from "@/lib/api/drift-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { Severity } from "@/lib/api/types";
import type { DriftData } from "@/lib/hooks/useDrift";

const order: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export function DriftSignalsPanel({ data }: { data: DriftData }) {
  const { list, driftById, driftLoading, anyDrift, systems } = data;

  const signals = list.flatMap((s) => {
    const e = s.rawId ? driftById.get(s.rawId) : undefined;
    if (!e?.isSuccess) return [];
    return normalizeDriftSignals(e.data, s.name);
  });
  signals.sort((a, b) => order[a.severity] - order[b.severity]);

  return (
    <SectionCard title="Drift Signals" subtitle="Detected drift events from telemetry" icon={Radar} accent="purple" className="h-full">
      {systems.isLoading || driftLoading ? (
        <SkeletonRows rows={5} />
      ) : !anyDrift || signals.length === 0 ? (
        <EmptyState icon={Radar} title="No drift signals returned" description="Drift signals — with type, severity, confidence, and source — will appear here once the backend reports them." />
      ) : (
        <ul className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
          {signals.slice(0, 12).map((sig) => (
            <li key={sig.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{sig.name}</p>
                <p className="truncate text-[11px] text-cv-mist">
                  {[sig.type, sig.linkedSystem, sig.source, sig.confidence != null ? `${Math.round(sig.confidence)}% conf` : null, formatRelativeTime(sig.timestamp)]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
              </div>
              {sig.hasSeverity ? (
                <SeverityBadge severity={sig.severity} />
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-400/10 px-2.5 py-1 text-xs font-semibold text-cv-slate ring-1 ring-slate-400/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  Unclassified
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
