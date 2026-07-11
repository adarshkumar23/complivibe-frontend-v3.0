"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { BookOpenText, Calculator, ListChecks, RefreshCw, Sigma, Sparkles, TriangleAlert } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useMaterializeScores, useScoring } from "@/lib/hooks/useScoring";
import type { ScoreSnapshot } from "@/lib/api/scoring";
import type { Accent } from "@/components/ui/accent";
import { cn } from "@/lib/utils/cn";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

const TYPE_ACCENTS: Record<string, Accent> = {
  compliance_readiness: "blue",
  control_health: "teal",
  evidence_readiness: "purple",
  risk_posture: "red",
  task_hygiene: "amber",
  governance_health: "green"
};

const label = (t: string) => t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function formatValue(v: unknown): string {
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(2);
  return String(v);
}

/** Generic renderer for breakdown_json / inputs_json — flat values plus one nested level. */
function KeyValueRows({ record }: { record: Record<string, unknown> }) {
  const entries = Object.entries(record);
  if (entries.length === 0) return <p className="text-xs text-cv-slate">Backend returned no detail for this section.</p>;
  return (
    <div className="space-y-1.5">
      {entries.map(([k, v]) => {
        if (v != null && typeof v === "object" && !Array.isArray(v)) {
          return (
            <div key={k} className="rounded-2xl bg-white/50 px-3 py-2 ring-1 ring-white/60">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-cv-mist">{k.replace(/_/g, " ")}</p>
              <div className="space-y-1">
                {Object.entries(v as Record<string, unknown>).map(([k2, v2]) => (
                  <div key={k2} className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-cv-slate">{k2.replace(/_/g, " ")}</span>
                    <span className="font-bold text-cv-ink">{formatValue(v2)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        if (k === "formula") {
          return (
            <div key={k} className="rounded-2xl bg-white/50 px-3 py-2 ring-1 ring-white/60">
              <p className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-cv-mist">formula</p>
              <code className="break-words text-[11.5px] font-semibold text-cv-ink">{String(v)}</code>
            </div>
          );
        }
        return (
          <div key={k} className="flex items-center justify-between gap-3 px-1 text-xs">
            <span className="font-medium text-cv-slate">{k.replace(/_/g, " ")}</span>
            <span className="font-bold text-cv-ink">{formatValue(v)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function ScoreExplainerPage() {
  const { latest, trends, methodology } = useScoring();
  const materialize = useMaterializeScores();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const snapshots = latest.data?.snapshots ?? [];
  const selected: ScoreSnapshot | undefined =
    snapshots.find((s) => s.snapshot_type === (selectedType ?? "compliance_readiness")) ?? snapshots[0];

  const trendFor = (t: string): number[] | null => {
    const series = trends.data?.series.find((s) => s.snapshot_type === t);
    if (!series || series.points.length < 2) return null;
    return series.points.map((p) => p.score);
  };

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
                <Calculator size={15} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Scoring</span>
            </div>
            <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">
              Score Explainer
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-cv-slate">
              Why each compliance score is what it is: the exact inputs, formula and component weights the backend used, per
              snapshot.
            </p>
          </div>
          <button
            type="button"
            onClick={() => materialize.mutate()}
            disabled={materialize.isPending}
            data-testid="recalculate-scores"
            className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-4 py-2.5 text-xs font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={14} className={materialize.isPending ? "animate-spin" : undefined} />
            {materialize.isPending ? "Recalculating..." : "Recalculate scores"}
          </button>
        </div>
        {materialize.isError ? (
          <div className="mt-3 flex items-start gap-2 rounded-2xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">
            <TriangleAlert size={14} className="mt-0.5 shrink-0" />
            <span>{materialize.error instanceof Error ? materialize.error.message : "Recalculation failed."}</span>
          </div>
        ) : null}
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        {latest.isLoading ? (
          <SkeletonRows rows={3} />
        ) : latest.isError ? (
          <ErrorState
            title="Scores could not load"
            description={latest.error instanceof Error ? latest.error.message : undefined}
            onRetry={() => latest.refetch()}
          />
        ) : snapshots.length === 0 ? (
          <SectionCard title="No score snapshots yet" subtitle="GET /scoring/snapshots/latest returned an empty list" icon={Calculator} accent="amber">
            <EmptyState
              icon={Calculator}
              title="Nothing has been scored yet"
              description="Run a recalculation to materialize the first score snapshots from your live compliance records."
            />
          </SectionCard>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
            {snapshots.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedType(s.snapshot_type)}
                data-testid={`score-card-${s.snapshot_type}`}
                className={cn(
                  "cv-ring-focus rounded-3xl text-left transition",
                  selected?.snapshot_type === s.snapshot_type ? "ring-2 ring-cv-blue/50" : "ring-0"
                )}
              >
                <StatCard
                  label={label(s.snapshot_type)}
                  icon={Sigma}
                  accent={TYPE_ACCENTS[s.snapshot_type] ?? "blue"}
                  value={s.score}
                  trend={trendFor(s.snapshot_type)}
                />
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {selected ? (
        <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SectionCard
            title={`${label(selected.snapshot_type)} — how it was computed`}
            subtitle={`Score ${selected.score}/100 · grade ${selected.grade} · calculated ${new Date(selected.calculated_at).toLocaleString()}`}
            icon={Sigma}
            accent={TYPE_ACCENTS[selected.snapshot_type] ?? "blue"}
            className="lg:col-span-2"
            action={<StatusBadge label={`Grade ${selected.grade}`} tone={selected.score >= 70 ? "good" : selected.score >= 40 ? "warn" : "bad"} />}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-cv-mist">Breakdown</p>
                <KeyValueRows record={selected.breakdown_json} />
              </div>
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-cv-mist">Inputs counted</p>
                <KeyValueRows record={selected.inputs_json} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Recommendations" subtitle="Backend-generated next steps" icon={Sparkles} accent="amber">
            {(selected.recommendations_json ?? []).length === 0 ? (
              <EmptyState compact icon={ListChecks} title="No recommendations" description="The backend returned none for this snapshot." />
            ) : (
              <ul className="space-y-2.5">
                {(selected.recommendations_json ?? []).map((r) => (
                  <li key={r} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-cv-slate">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cv-brand" />
                    {r}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </motion.div>
      ) : null}

      <motion.div variants={fade} custom={3} initial="hidden" animate="show">
        <SectionCard title="Methodology" subtitle="GET /scoring/methodology — formulas and caveats" icon={BookOpenText} accent="teal">
          {methodology.isLoading ? (
            <SkeletonRows rows={3} />
          ) : methodology.isError ? (
            <ErrorState
              compact
              title="Methodology unavailable"
              description={methodology.error instanceof Error ? methodology.error.message : undefined}
              onRetry={() => methodology.refetch()}
            />
          ) : methodology.data ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {Object.entries(methodology.data.snapshot_types).map(([t, m]) => (
                  <div key={t} className="rounded-2xl bg-white/55 px-4 py-3 ring-1 ring-white/70">
                    <p className="text-[13px] font-bold text-cv-ink">{label(t)}</p>
                    {m.formula ? <code className="mt-1 block break-words text-[11.5px] font-semibold text-cv-blue">{m.formula}</code> : null}
                    {m.notes ? <p className="mt-1.5 text-xs leading-relaxed text-cv-slate">{m.notes}</p> : null}
                  </div>
                ))}
              </div>
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-cv-mist">Caveats</p>
                <ul className="space-y-1.5">
                  {methodology.data.caveats.map((c) => (
                    <li key={c} className="flex items-start gap-2.5 text-xs leading-relaxed text-cv-slate">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cv-mist" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </SectionCard>
      </motion.div>
    </div>
  );
}
