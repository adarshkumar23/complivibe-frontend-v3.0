"use client";

import { HeartPulse, Plug, CheckCircle2, AlertTriangle, PlugZap } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { ApiError } from "@/lib/api/client";
import { normalizeConnectorHealth, stateTone, STATE_LABEL } from "@/lib/api/connector-health-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { ConnectorHealthData } from "@/lib/hooks/useConnectorHealth";

/** A 404 means the endpoint is absent on this backend → treat as "no signal", not a hard error. */
function isHardError(err: unknown): boolean {
  if (err instanceof ApiError) return err.status !== 404;
  return !!err;
}

function MiniStat({ label, value, icon: Icon, tone }: { label: string; value: number | null; icon: typeof Plug; tone: string }) {
  const has = value != null && Number.isFinite(value);
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl bg-white/55 p-3.5 ring-1 ring-white/70">
      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${tone}`}>
        <Icon size={15} strokeWidth={2.2} />
      </span>
      <span className={`text-2xl font-extrabold leading-none tracking-tight ${has ? "text-cv-ink" : "text-cv-mist"}`}>
        {has ? value : "—"}
      </span>
      <span className="text-[11px] font-medium text-cv-slate">{label}</span>
    </div>
  );
}

export function ConnectorHealthCard({ data }: { data: ConnectorHealthData }) {
  const { summary, list } = data;
  const ch = normalizeConnectorHealth(summary.isSuccess ? summary.data : null, list.isSuccess ? list.data : null);

  const loading = summary.isLoading || list.isLoading;
  const hardError = isHardError(summary.error) || isHardError(list.error);

  return (
    <SectionCard
      title="Connector Health"
      subtitle="Live health of connected evidence sources"
      icon={HeartPulse}
      accent="teal"
      action={
        ch.hasSignal && ch.total != null ? (
          <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
            {ch.total} connectors
          </span>
        ) : null
      }
    >
      {loading ? (
        <SkeletonRows rows={3} />
      ) : !ch.hasSignal ? (
        hardError ? (
          <ErrorState
            title="Unable to load connector health"
            description="The connector health service did not respond. It may be temporarily unavailable."
            onRetry={() => {
              summary.refetch();
              list.refetch();
            }}
          />
        ) : (
          <EmptyState
            icon={Plug}
            title="No connector health signal yet"
            description="Connected sources will report their health here once the backend returns connector data."
          />
        )
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="Total" value={ch.total} icon={Plug} tone="bg-blue-500/12 text-blue-600" />
            <MiniStat label="Healthy" value={ch.healthy} icon={CheckCircle2} tone="bg-emerald-500/12 text-emerald-600" />
            <MiniStat label="Needs attention" value={ch.attention} icon={AlertTriangle} tone="bg-amber-400/15 text-amber-600" />
            <MiniStat label="Unavailable" value={ch.unavailable} icon={PlugZap} tone="bg-slate-400/12 text-slate-500" />
          </div>

          {ch.connectors.length > 0 ? (
            <ul className="divide-y divide-white/50">
              {ch.connectors.slice(0, 8).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/70 text-cv-slate">
                      <Plug size={15} strokeWidth={2.2} />
                    </span>
                    <span className="truncate text-[13px] font-semibold text-cv-ink">{c.name}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden text-[11px] text-cv-mist sm:inline">
                      {c.lastSync ? `Checked ${formatRelativeTime(c.lastSync)}` : "No check recorded"}
                    </span>
                    <StatusBadge label={STATE_LABEL[c.state]} tone={stateTone(c.state)} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-cv-mist">No connected sources found.</p>
          )}
        </div>
      )}
    </SectionCard>
  );
}
