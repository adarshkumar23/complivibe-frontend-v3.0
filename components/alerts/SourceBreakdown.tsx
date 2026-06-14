"use client";

import { Brain, Lightbulb, Radar } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { normalizeAlerts } from "@/lib/api/normalizers";
import type { AlertsData } from "@/lib/hooks/useAlerts";

export function SourceBreakdown({ data }: { data: AlertsData }) {
  const { insights, predictive } = data;
  const proactive = insights.isSuccess ? normalizeAlerts(insights.data, undefined).length : null;
  const predicted = predictive.isSuccess ? normalizeAlerts(undefined, predictive.data).length : null;

  const loading = insights.isLoading && predictive.isLoading;
  const errored = insights.isError && predictive.isError;
  const total = (proactive ?? 0) + (predicted ?? 0);
  const hasAny = proactive != null || predicted != null;

  const Bar = ({ label, value, color }: { label: string; value: number | null; color: string }) => (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[13px]">
        <span className="font-semibold text-cv-ink">{label}</span>
        <span className={value != null ? "font-bold text-cv-ink" : "text-cv-mist"}>{value != null ? value : "—"}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-400/12">
        {value != null ? <div className="h-full rounded-full" style={{ width: `${total > 0 ? Math.max(4, (value / total) * 100) : 4}%`, background: color }} /> : null}
      </div>
    </div>
  );

  return (
    <SectionCard title="Signal Sources" subtitle="Proactive vs predictive" icon={Radar} accent="purple" className="h-full">
      {loading ? (
        <div className="space-y-4">
          <LoadingSkeleton className="h-8 w-full" />
          <LoadingSkeleton className="h-8 w-full" />
        </div>
      ) : errored ? (
        <ErrorState compact title="Unable to load sources" onRetry={() => insights.refetch()} />
      ) : !hasAny ? (
        <EmptyState compact icon={Radar} title="No signal sources" description="Proactive and predictive counts appear here once alerts are returned." />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex items-center gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
              <IconTile icon={Lightbulb} accent="amber" size="sm" />
              <div>
                <p className={`text-lg font-extrabold leading-none ${proactive != null ? "text-cv-ink" : "text-cv-mist"}`}>{proactive ?? "—"}</p>
                <p className="mt-0.5 text-[11px] font-medium text-cv-slate">Proactive</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
              <IconTile icon={Brain} accent="purple" size="sm" />
              <div>
                <p className={`text-lg font-extrabold leading-none ${predicted != null ? "text-cv-ink" : "text-cv-mist"}`}>{predicted ?? "—"}</p>
                <p className="mt-0.5 text-[11px] font-medium text-cv-slate">Predictive</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <Bar label="Proactive insights" value={proactive} color="#F59E0B" />
            <Bar label="Predictive alerts" value={predicted} color="#8B5CF6" />
          </div>
        </div>
      )}
    </SectionCard>
  );
}
