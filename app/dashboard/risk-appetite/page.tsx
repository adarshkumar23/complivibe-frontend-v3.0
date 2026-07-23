"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  Activity,
  AlertOctagon,
  Gauge,
  Info,
  Plus,
  RefreshCw,
  ShieldAlert,
  SlidersHorizontal
} from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { useHasPermission } from "@/lib/hooks/usePermissions";
import { useRiskAppetite, useRecalculateKri } from "@/lib/hooks/useRiskAppetite";
import {
  RISK_APPETITE_CATEGORIES,
  type AppetiteBreach,
  type KriStatus,
  type RiskAppetiteThresholdRead,
  type RiskIndicatorRead
} from "@/lib/api/risk-appetite";
import { KriCreateModal } from "@/components/risk-appetite/KriCreateModal";
import { AppetiteThresholdModal } from "@/components/risk-appetite/AppetiteThresholdModal";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

function prettify(v: string) {
  return v.replaceAll("_", " ");
}

/** Map the backend KRI status enum to a StatusBadge tone. */
const KRI_TONE: Record<KriStatus, "good" | "warn" | "bad" | "neutral"> = {
  green: "good",
  amber: "warn",
  red: "bad",
  not_calculated: "neutral"
};

function fmtValue(v: number | null): string {
  if (v === null || v === undefined) return "—";
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

// ── KRI section ──────────────────────────────────────────────────────────────
function KriRow({ kri, canWrite }: { kri: RiskIndicatorRead; canWrite: boolean }) {
  const recalc = useRecalculateKri();
  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl bg-white/45 px-3.5 py-3 ring-1 ring-white/60">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-cv-ink">{kri.name}</p>
          {kri.stale ? <StatusBadge label="stale" tone="neutral" /> : null}
        </div>
        <p className="mt-0.5 text-xs text-cv-slate">
          {prettify(kri.metric_type)} · warn {fmtValue(kri.warning_threshold)} / crit{" "}
          {fmtValue(kri.critical_threshold)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-bold tabular-nums text-cv-ink">{fmtValue(kri.current_value)}</p>
          <StatusBadge label={prettify(kri.status)} tone={KRI_TONE[kri.status]} />
        </div>
        {canWrite ? (
          <button
            type="button"
            onClick={() => recalc.mutate(kri.id)}
            disabled={recalc.isPending}
            title="Recalculate current value + status"
            className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white disabled:opacity-60"
          >
            <RefreshCw size={13} className={recalc.isPending ? "animate-spin" : ""} strokeWidth={2.4} />
            Recalculate
          </button>
        ) : null}
      </div>
    </li>
  );
}

function KriSection({ data }: { data: ReturnType<typeof useRiskAppetite> }) {
  const [open, setOpen] = useState(false);
  const canWrite = useHasPermission("risk_indicators:write");
  const { kris, kriSummary } = data;

  const summary = kriSummary.data;
  const subtitle = summary
    ? `${summary.total_indicators} indicators · ${summary.critical_count} critical · ${summary.warning_count} warning`
    : "Key risk indicators with warning + critical thresholds";

  return (
    <>
      <SectionCard
        title="Key Risk Indicators"
        subtitle={subtitle}
        icon={Gauge}
        accent="teal"
        action={
          canWrite ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-4 py-2 text-xs font-semibold text-white shadow-tile transition hover:opacity-90"
            >
              <Plus size={14} strokeWidth={2.6} />
              New KRI
            </button>
          ) : null
        }
      >
        {kris.isLoading ? (
          <SkeletonRows rows={3} />
        ) : kris.isError ? (
          <ErrorState compact onRetry={() => kris.refetch()} />
        ) : (kris.data ?? []).length === 0 ? (
          <EmptyState
            icon={Gauge}
            compact
            title="No indicators yet"
            description="Create a KRI to track metrics like overdue tasks or evidence gaps against thresholds."
          />
        ) : (
          <ul className="space-y-2.5">
            {kris.data!.map((k) => (
              <KriRow key={k.id} kri={k} canWrite={canWrite} />
            ))}
          </ul>
        )}
      </SectionCard>
      <KriCreateModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

// ── Appetite thresholds section ──────────────────────────────────────────────
function AppetiteThresholdsSection({ data }: { data: ReturnType<typeof useRiskAppetite> }) {
  const [open, setOpen] = useState(false);
  const canWrite = useHasPermission("risk_appetite:write");
  const { thresholds, appetiteSummary } = data;

  const summary = appetiteSummary.data;
  const missing = summary?.categories_without_threshold ?? [];

  return (
    <>
      <SectionCard
        title="Risk Appetite Thresholds"
        subtitle="Maximum acceptable score per risk category (1–25 scale)"
        icon={SlidersHorizontal}
        accent="purple"
        action={
          canWrite ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-4 py-2 text-xs font-semibold text-white shadow-tile transition hover:opacity-90"
            >
              <Plus size={14} strokeWidth={2.6} />
              New threshold
            </button>
          ) : null
        }
      >
        {/*
          KNOWN DESIGN GAP (surfaced honestly, not fixed here): appetite thresholds
          cover only the 7 closed categories. risk.category is free-form; any risk
          whose category is not one of the 7 is silently evaluated against the
          "operational" threshold on the backend. The note below tells the user this.
        */}
        <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-blue-500/10 px-3.5 py-2.5 ring-1 ring-blue-400/20">
          <Info size={15} className="mt-0.5 shrink-0 text-blue-600" />
          <p className="text-[11px] leading-relaxed text-blue-700">
            Appetite thresholds cover 7 standard categories (
            {RISK_APPETITE_CATEGORIES.map(prettify).join(", ")}). Risks with any other category (e.g. custom or
            &ldquo;other&rdquo;) are evaluated against the <span className="font-semibold">Operational</span> threshold.
          </p>
        </div>

        {thresholds.isLoading ? (
          <SkeletonRows rows={3} />
        ) : thresholds.isError ? (
          <ErrorState compact onRetry={() => thresholds.refetch()} />
        ) : (thresholds.data ?? []).length === 0 ? (
          <EmptyState
            icon={SlidersHorizontal}
            compact
            title="No thresholds set"
            description="Define the maximum acceptable score for each risk category."
          />
        ) : (
          <ul className="space-y-2.5">
            {thresholds.data!.map((t: RiskAppetiteThresholdRead) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white/45 px-3.5 py-3 ring-1 ring-white/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold capitalize text-cv-ink">{prettify(t.risk_category)}</p>
                  <p className="mt-0.5 text-xs text-cv-slate">
                    Scope: {t.scope_type === "org" ? "Organization" : prettify(t.scope_type)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold tabular-nums text-cv-ink">
                    {t.max_acceptable_score}
                    <span className="text-xs font-medium text-cv-mist"> / 25</span>
                  </p>
                  <p className="text-[11px] text-cv-slate">max acceptable</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {missing.length > 0 ? (
          <p className="mt-3 text-[11px] text-cv-mist">
            No threshold yet for: {missing.map(prettify).join(", ")}.
          </p>
        ) : null}
      </SectionCard>
      <AppetiteThresholdModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

// ── Breaches section ─────────────────────────────────────────────────────────
function BreachRow({ breach }: { breach: AppetiteBreach }) {
  const realCategory = breach.risk?.category ?? null;
  // Surface the honesty gap: if the risk's real (free-form) category differs from
  // the threshold category it was scored against, show both so the mapping is visible.
  const mismatched = realCategory !== null && realCategory !== breach.risk_category;

  return (
    <li className="rounded-2xl bg-rose-500/5 px-3.5 py-3 ring-1 ring-rose-400/20">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-cv-ink">{breach.risk?.name ?? breach.title}</p>
          <p className="mt-0.5 text-xs text-cv-slate">
            Threshold category: <span className="font-medium capitalize">{prettify(breach.risk_category)}</span>
            {mismatched ? (
              <>
                {" · "}risk category:{" "}
                <span className="font-medium capitalize">{prettify(realCategory!)}</span>{" "}
                <span className="text-cv-mist">(mapped to {prettify(breach.risk_category)})</span>
              </>
            ) : null}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold tabular-nums text-rose-600">
            {breach.new_score}
            <span className="text-xs font-medium text-cv-mist"> &gt; {breach.max_acceptable_score}</span>
          </p>
          <StatusBadge label={breach.severity || breach.status} tone="bad" />
        </div>
      </div>
    </li>
  );
}

function BreachesSection({ data }: { data: ReturnType<typeof useRiskAppetite> }) {
  const { breaches } = data;
  const count = breaches.data?.length ?? 0;

  return (
    <SectionCard
      title="Appetite Breaches"
      subtitle={count > 0 ? `${count} risk${count === 1 ? "" : "s"} over appetite` : "Risks exceeding their category threshold"}
      icon={AlertOctagon}
      accent="red"
    >
      {breaches.isLoading ? (
        <SkeletonRows rows={2} />
      ) : breaches.isError ? (
        <ErrorState compact onRetry={() => breaches.refetch()} />
      ) : count === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          compact
          title="Within appetite"
          description="No risks currently exceed their category's maximum acceptable score."
        />
      ) : (
        <ul className="space-y-2.5">
          {breaches.data!.map((b) => (
            <BreachRow key={b.alert_id} breach={b} />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function RiskAppetitePage() {
  const data = useRiskAppetite();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
              <Activity size={15} />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Risk Analytics</span>
          </div>
          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">
            KRIs &amp; Risk Appetite
          </h1>
          <p className="max-w-2xl text-[15px] text-cv-slate">
            Track key risk indicators against thresholds and define the maximum acceptable risk score per category.
          </p>
        </div>
      </motion.div>

      <motion.div
        variants={fade}
        custom={1}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        <KriSection data={data} />
        <AppetiteThresholdsSection data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show">
        <BreachesSection data={data} />
      </motion.div>
    </div>
  );
}
