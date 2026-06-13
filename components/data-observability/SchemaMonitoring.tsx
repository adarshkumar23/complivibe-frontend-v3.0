"use client";

import { GitCompareArrows } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { schemaSummary } from "@/lib/api/data-observability-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { DataObservability } from "@/lib/hooks/useDataObservability";

function StatTile({ label, value, tone }: { label: string; value: number | null; tone: string }) {
  return (
    <div className="rounded-xl bg-white/50 px-2.5 py-2 text-center ring-1 ring-white/60">
      <p className={`text-lg font-extrabold ${value != null ? tone : "text-cv-mist"}`}>{value != null ? value : "—"}</p>
      <p className="text-[10px] font-medium leading-tight text-cv-slate">{label}</p>
    </div>
  );
}

export function SchemaMonitoring({ data }: { data: DataObservability }) {
  const { catalog, overview } = data;
  const summary = schemaSummary(catalog.data, overview.data);
  const hasCounts = summary.fieldsAdded != null || summary.fieldsRemoved != null || summary.contractViolations != null;
  const hasAny = hasCounts || summary.changes.length > 0;
  const loading = catalog.isLoading && overview.isLoading;
  const errored = catalog.isError && overview.isError;

  return (
    <SectionCard title="Schema & Change Monitoring" subtitle="Recent schema drift & contracts" icon={GitCompareArrows} accent="purple">
      {loading ? (
        <SkeletonRows rows={3} />
      ) : errored ? (
        <ErrorState compact title="Unable to load schema data" onRetry={() => catalog.refetch()} />
      ) : !hasAny ? (
        <EmptyState
          compact
          icon={GitCompareArrows}
          title="No schema changes detected"
          description="Field additions, removals, and contract violations will appear here when detected."
        />
      ) : (
        <div className="space-y-4">
          {hasCounts ? (
            <div className="grid grid-cols-3 gap-2.5">
              <StatTile label="Fields added" value={summary.fieldsAdded} tone="text-emerald-600" />
              <StatTile label="Fields removed" value={summary.fieldsRemoved} tone="text-rose-600" />
              <StatTile label="Contract violations" value={summary.contractViolations} tone="text-amber-600" />
            </div>
          ) : null}
          {summary.changes.length > 0 ? (
            <ul className="space-y-2.5">
              {summary.changes.slice(0, 4).map((c) => (
                <li key={c.id} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cv-brand" />
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-[13px] font-medium text-cv-ink">{c.title}</p>
                    <p className="text-[11px] text-cv-mist">
                      {[c.type, formatRelativeTime(c.timestamp)].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </SectionCard>
  );
}
