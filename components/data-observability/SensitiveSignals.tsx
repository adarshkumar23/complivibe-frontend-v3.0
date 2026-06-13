"use client";

import { ShieldAlert, FileSearch, Eye, UserX, Trash2, type LucideIcon } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { sensitiveSignals } from "@/lib/api/data-observability-normalizers";
import type { DataObservability } from "@/lib/hooks/useDataObservability";
import type { Accent } from "@/components/ui/accent";
import { IconTile } from "@/components/ui/IconTile";

function SignalTile({ icon, label, value, accent }: { icon: LucideIcon; label: string; value: number | null; accent: Accent }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
      <IconTile icon={icon} accent={accent} size="sm" />
      <div className="min-w-0">
        <p className={`text-lg font-extrabold leading-none ${value != null ? "text-cv-ink" : "text-cv-mist"}`}>
          {value != null ? value : "—"}
        </p>
        <p className="mt-0.5 text-[11px] font-medium text-cv-slate">{label}</p>
      </div>
    </div>
  );
}

export function SensitiveSignals({ data }: { data: DataObservability }) {
  const { sensitive } = data;
  const s = sensitiveSignals(sensitive.data);
  const hasAny = s.pii != null || s.exposure != null || s.accessAnomalies != null || s.retention != null;

  return (
    <SectionCard title="Sensitive Data & Access Signals" subtitle="PII, exposure & access risks" icon={ShieldAlert} accent="red">
      {sensitive.isLoading ? (
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : sensitive.isError ? (
        <ErrorState compact title="Unable to load sensitive data" onRetry={() => sensitive.refetch()} />
      ) : !hasAny ? (
        <EmptyState
          compact
          icon={ShieldAlert}
          title="No sensitive findings"
          description="PII findings, exposure risks, access anomalies, and retention violations will appear here."
        />
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          <SignalTile icon={FileSearch} label="PII findings" value={s.pii} accent="purple" />
          <SignalTile icon={Eye} label="Exposure risks" value={s.exposure} accent="amber" />
          <SignalTile icon={UserX} label="Access anomalies" value={s.accessAnomalies} accent="blue" />
          <SignalTile icon={Trash2} label="Retention violations" value={s.retention} accent="red" />
        </div>
      )}
    </SectionCard>
  );
}
