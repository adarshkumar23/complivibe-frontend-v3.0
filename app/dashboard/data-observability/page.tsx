"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  Activity,
  Archive,
  Database,
  Globe2,
  KeyRound,
  Lightbulb,
  ShieldAlert,
  Tags,
  Workflow
} from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataObsAssetsTable } from "@/components/data-observability/DataObsAssetsTable";
import { useDataObservability } from "@/lib/hooks/useDataObservability";
import type { UseQueryResult } from "@tanstack/react-query";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

/** Render a stat-breakdown record as label→count rows, or an honest empty note. */
function BreakdownRows({ record, emptyNote }: { record: Record<string, number> | undefined; emptyNote: string }) {
  const entries = Object.entries(record ?? {}).filter(([, v]) => v > 0);
  if (entries.length === 0) {
    return <p className="text-xs text-cv-slate">{emptyNote}</p>;
  }
  return (
    <div className="space-y-1.5">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between text-xs">
          <span className="font-medium text-cv-slate">{k.replace(/_/g, " ")}</span>
          <span className="font-bold text-cv-ink">{v}</span>
        </div>
      ))}
    </div>
  );
}

function SummaryBody<T>({
  query,
  children
}: {
  query: UseQueryResult<T>;
  children: (data: T) => React.ReactNode;
}) {
  if (query.isLoading) return <SkeletonRows rows={2} />;
  if (query.isError)
    return (
      <ErrorState
        compact
        title="Could not load"
        description={query.error instanceof Error ? query.error.message : undefined}
        onRetry={() => query.refetch()}
      />
    );
  return <>{children(query.data as T)}</>;
}

export default function DataObservabilityPage() {
  const data = useDataObservability();
  const { dashboard, quality, retention, residency, incidents, access } = data;
  const d = dashboard.data;

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
                <Database size={15} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Data Governance</span>
            </div>
            <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">
              Data Observability
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-cv-slate">
              Live asset inventory, classification coverage, quality, access anomalies, retention and residency — all from the
              real data-observability backend.
            </p>
          </div>
          <Link
            href="/dashboard/data-observability/lineage"
            className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2.5 text-xs font-bold text-cv-ink ring-1 ring-white/70 transition hover:bg-white"
          >
            <Workflow size={14} />
            Data lineage
          </Link>
        </div>
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <RegistryKpi
          label="Data Assets"
          icon={Database}
          accent="cyan"
          value={d ? d.asset_coverage.total_assets : null}
          caption={d ? `${d.asset_coverage.confirmed_count} confirmed classifications` : undefined}
          loading={dashboard.isLoading}
          unavailableHint="Dashboard unavailable"
        />
        <RegistryKpi
          label="Classification Coverage"
          icon={Tags}
          accent="blue"
          value={d ? d.asset_coverage.classification_coverage_pct : null}
          suffix="%"
          scoreToneFor={d ? d.asset_coverage.classification_coverage_pct : null}
          caption={d ? `${d.asset_coverage.needs_review_count} need review` : undefined}
          loading={dashboard.isLoading}
          unavailableHint="Dashboard unavailable"
        />
        <RegistryKpi
          label="Quality Breaches (7d)"
          icon={Activity}
          accent="amber"
          value={d ? d.quality_metrics.breach_count_7d : null}
          caption={d ? `${d.quality_metrics.readings_last_7d} readings ingested` : undefined}
          loading={dashboard.isLoading}
          unavailableHint="Dashboard unavailable"
        />
        <RegistryKpi
          label="Active Data Incidents"
          icon={ShieldAlert}
          accent="red"
          value={d ? d.access_anomalies.active_incidents : null}
          caption={d ? `${d.access_anomalies.anomaly_count_7d} anomalies last 7d` : undefined}
          loading={dashboard.isLoading}
          unavailableHint="Dashboard unavailable"
        />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show">
        <SectionCard
          title="Backend insights"
          subtitle={d ? `Generated ${new Date(d.generated_at).toLocaleString()}` : "Plain-language findings from the live dashboard endpoint"}
          icon={Lightbulb}
          accent="amber"
        >
          <SummaryBody query={dashboard}>
            {(dd) =>
              dd.insights.length === 0 ? (
                <EmptyState compact icon={Lightbulb} title="No insights returned" />
              ) : (
                <ul className="space-y-2">
                  {dd.insights.map((line) => (
                    <li key={line} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-cv-slate">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cv-brand" />
                      {line}
                    </li>
                  ))}
                </ul>
              )
            }
          </SummaryBody>
        </SectionCard>
      </motion.div>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show">
        <DataObsAssetsTable data={data} />
      </motion.div>

      <motion.div variants={fade} custom={4} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SectionCard title="Data quality" subtitle="Configs and 7-day breaches" icon={Activity} accent="green">
          <SummaryBody query={quality}>
            {(q) => (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <StatusBadge label={`${q.active_configs} active configs`} tone={q.active_configs > 0 ? "good" : "neutral"} />
                  <StatusBadge label={`${q.recent_breaches_7d} breaches 7d`} tone={q.recent_breaches_7d > 0 ? "bad" : "good"} />
                </div>
                {q.total_configs === 0 ? (
                  <p className="text-xs text-cv-slate">No quality checks configured yet — the live endpoint returned zero configs.</p>
                ) : (
                  <BreakdownRows
                    record={Object.fromEntries(Object.entries(q.by_metric_type).map(([k, v]) => [k, v.configs]))}
                    emptyNote="No metric-type breakdown yet."
                  />
                )}
              </div>
            )}
          </SummaryBody>
        </SectionCard>

        <SectionCard title="Access activity" subtitle="Last 7 days of access logs" icon={KeyRound} accent="purple">
          <SummaryBody query={access}>
            {(a) => (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <StatusBadge label={`${a.total_accesses_7d} accesses`} tone="info" />
                  <StatusBadge label={`${a.anomalies_detected} anomalies`} tone={a.anomalies_detected > 0 ? "warn" : "good"} />
                </div>
                {a.total_accesses_7d === 0 ? (
                  <p className="text-xs text-cv-slate">No access events recorded in the last {a.window_days} days.</p>
                ) : (
                  <BreakdownRows record={a.by_access_type} emptyNote="No access-type breakdown." />
                )}
              </div>
            )}
          </SummaryBody>
        </SectionCard>

        <SectionCard title="Retention" subtitle="Policy coverage and reviews" icon={Archive} accent="teal">
          <SummaryBody query={retention}>
            {(r) => (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <StatusBadge
                    label={`${Math.round(r.compliance_rate)}% compliant`}
                    tone={r.compliance_rate >= 90 ? "good" : r.compliance_rate >= 60 ? "warn" : "bad"}
                  />
                  <StatusBadge label={`${r.pending_reviews} pending reviews`} tone={r.pending_reviews > 0 ? "warn" : "good"} />
                </div>
                {r.total_assets_with_policy === 0 ? (
                  <p className="text-xs text-cv-slate">No assets have a retention policy applied yet.</p>
                ) : (
                  <BreakdownRows record={r.by_required_action} emptyNote="No pending retention actions." />
                )}
              </div>
            )}
          </SummaryBody>
        </SectionCard>

        <SectionCard title="Residency" subtitle="Geographic compliance checks" icon={Globe2} accent="blue">
          <SummaryBody query={residency}>
            {(r) => (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <StatusBadge label={`${r.total_assets_checked} checked`} tone="info" />
                  <StatusBadge label={`${r.open_violations} open violations`} tone={r.open_violations > 0 ? "bad" : "good"} />
                </div>
                {r.total_assets_checked === 0 ? (
                  <p className="text-xs text-cv-slate">No residency checks have run — no assets with geographic locations yet.</p>
                ) : (
                  <BreakdownRows record={r.by_violation_type} emptyNote="No violations by type." />
                )}
              </div>
            )}
          </SummaryBody>
        </SectionCard>
      </motion.div>

      <motion.div variants={fade} custom={5} initial="hidden" animate="show">
        <SectionCard title="Data incidents" subtitle="Detector output across all assets" icon={ShieldAlert} accent="red">
          <SummaryBody query={incidents}>
            {(i) =>
              i.total === 0 ? (
                <EmptyState
                  compact
                  icon={ShieldAlert}
                  title="No data incidents recorded"
                  description="The live incidents endpoint returned zero incidents for this organization."
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-cv-mist">By severity</p>
                    <BreakdownRows record={i.by_severity} emptyNote="—" />
                  </div>
                  <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-cv-mist">By status</p>
                    <BreakdownRows record={i.by_status} emptyNote="—" />
                  </div>
                  <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-cv-mist">By detector</p>
                    <BreakdownRows record={i.by_detector_type} emptyNote="—" />
                  </div>
                </div>
              )
            }
          </SummaryBody>
        </SectionCard>
      </motion.div>
    </div>
  );
}
