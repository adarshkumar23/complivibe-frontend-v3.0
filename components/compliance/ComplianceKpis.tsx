"use client";

import { LayoutGrid, ClipboardList, ShieldCheck, OctagonAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { IconTile } from "@/components/ui/IconTile";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import type { Accent } from "@/components/ui/accent";
import type { Compliance } from "@/lib/hooks/useCompliance";

type Kpi = {
  label: string;
  icon: LucideIcon;
  accent: Accent;
  value: number | null;
  suffix?: string;
  /** Secondary context for the number, derived from the same backend payload. */
  caption: string | null;
  captionTone?: "ok" | "warn" | "bad" | "muted";
};

function KpiCard({ kpi, loading }: { kpi: Kpi; loading: boolean }) {
  const toneClass =
    kpi.captionTone === "bad"
      ? "text-rose-600"
      : kpi.captionTone === "warn"
        ? "text-amber-600"
        : kpi.captionTone === "ok"
          ? "text-emerald-600"
          : "text-cv-slate";
  return (
    <GlassCard hover className="flex flex-col gap-3 p-5">
      <IconTile icon={kpi.icon} accent={kpi.accent} size="md" />
      {loading ? (
        <LoadingSkeleton className="h-9 w-24" />
      ) : (
        <p className="text-[30px] font-extrabold leading-none text-cv-ink">
          {kpi.value != null ? (
            <>
              {kpi.value}
              {kpi.suffix ? <span className="ml-0.5 text-base font-bold text-cv-mist">{kpi.suffix}</span> : null}
            </>
          ) : (
            <span className="text-lg font-bold text-cv-mist">Unavailable</span>
          )}
        </p>
      )}
      <div>
        <p className="text-[13px] font-bold text-cv-ink">{kpi.label}</p>
        {!loading && kpi.caption ? (
          <p className={`mt-0.5 text-[11px] font-medium leading-snug ${toneClass}`}>{kpi.caption}</p>
        ) : null}
      </div>
    </GlassCard>
  );
}

export function ComplianceKpis({ data }: { data: Compliance }) {
  const { posture, issueDashboard } = data;
  const p = posture.data;
  const iss = issueDashboard.data;

  const avgCoverage =
    p && p.active_frameworks.list.length > 0
      ? Math.round(
          p.active_frameworks.list.reduce((s, f) => s + f.coverage_pct, 0) / p.active_frameworks.list.length
        )
      : null;
  const weakest =
    p && p.active_frameworks.list.length > 1
      ? [...p.active_frameworks.list].sort((a, b) => a.coverage_pct - b.coverage_pct)[0]
      : null;

  const kpis: Kpi[] = [
    {
      label: "Active Frameworks",
      icon: LayoutGrid,
      accent: "purple",
      value: p ? p.active_frameworks.count : null,
      caption:
        avgCoverage != null
          ? `${avgCoverage}% avg control coverage${weakest ? ` — ${weakest.name} weakest at ${Math.round(weakest.coverage_pct)}%` : ""}`
          : null,
      captionTone: avgCoverage != null && avgCoverage < 40 ? "warn" : "muted"
    },
    {
      label: "Obligations Scoped",
      icon: ClipboardList,
      accent: "blue",
      value: p ? p.obligations.applicable : null,
      suffix: p ? ` / ${p.obligations.total}` : undefined,
      caption: p
        ? p.obligations.unknown > 0
          ? `${p.obligations.unknown} obligations still need an applicability decision`
          : "All obligations have an applicability decision"
        : null,
      captionTone: p && p.obligations.unknown > 0 ? "warn" : "ok"
    },
    {
      label: "Controls With Evidence",
      icon: ShieldCheck,
      accent: "teal",
      value: p ? p.controls.with_evidence : null,
      suffix: p ? ` / ${p.controls.total}` : undefined,
      caption: p
        ? p.controls.without_evidence > 0
          ? `${p.controls.without_evidence} controls have no supporting evidence yet`
          : p.controls.total > 0
            ? "Every control has at least one evidence record"
            : "No controls registered yet"
        : null,
      captionTone: p && p.controls.without_evidence > 0 ? "warn" : "ok"
    },
    {
      label: "Open Critical Issues",
      icon: OctagonAlert,
      accent: "red",
      value: iss ? iss.open_critical_count : null,
      caption: iss
        ? iss.open_critical_count > 0
          ? `${iss.unassigned_count} of ${iss.total} issues unassigned — assign critical ones first`
          : `${iss.total} issues tracked, none critical and open`
        : null,
      captionTone: iss && iss.open_critical_count > 0 ? "bad" : "ok"
    }
  ];

  const loading = posture.isLoading || issueDashboard.isLoading;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((k) => (
        <KpiCard key={k.label} kpi={k} loading={loading} />
      ))}
    </div>
  );
}
