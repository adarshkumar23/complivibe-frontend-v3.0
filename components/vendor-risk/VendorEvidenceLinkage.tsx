"use client";

import { useState } from "react";
import { Share2, ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useRecomputeConcentration, type VendorRiskData } from "@/lib/hooks/useVendorRisk";
import { useHasPermission } from "@/lib/hooks/usePermissions";

/**
 * Concentration-risk panel from GET /api/v1/vendor-concentration-risk.
 * POST /api/v1/vendor-concentration-risk/recompute runs the real HHI calculation
 * over active critical/high-tier vendors + supply-chain dependency links,
 * weighted by each vendor's annual_spend_amount when captured; a breach can
 * create a risk-register entry (risk_id below).
 */
export function VendorEvidenceLinkage({ data }: { data: VendorRiskData }) {
  const { concentration } = data;
  const c = concentration.data;
  const recompute = useRecomputeConcentration();
  const [recomputeError, setRecomputeError] = useState<string | null>(null);
  const canManageConcentration = useHasPermission("vendor_concentration_risk:manage");

  function runRecompute() {
    setRecomputeError(null);
    recompute.mutate(undefined, {
      onError: (err) => setRecomputeError(err instanceof Error ? err.message : "Recompute failed.")
    });
  }

  return (
    <SectionCard
      title="Concentration Risk"
      subtitle="Single-vendor dependency exposure (HHI)"
      icon={Share2}
      accent="teal"
      action={
        canManageConcentration && c && c.status !== "not_computed" ? (
          <button
            type="button"
            onClick={runRecompute}
            disabled={recompute.isPending}
            data-testid="recompute-concentration"
            title="Recompute HHI from current vendor tiers, dependencies, and spend"
            className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1.5 text-[11px] font-bold text-cv-slate ring-1 ring-white/70 transition hover:bg-white hover:text-cv-blue disabled:opacity-60"
          >
            {recompute.isPending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} strokeWidth={2.4} />}
            Recompute
          </button>
        ) : null
      }
    >
      {concentration.isLoading ? (
        <SkeletonRows rows={3} />
      ) : concentration.isError ? (
        <ErrorState compact title="Unable to load concentration risk" onRetry={() => concentration.refetch()} />
      ) : !c || c.status === "not_computed" ? (
        <div className="flex flex-col items-center">
          <EmptyState
            compact
            icon={Share2}
            title="Not computed yet"
            description="HHI is computed from active critical/high-tier vendors and their supply-chain dependencies, weighted by annual spend where captured."
          />
          {canManageConcentration ? (
            <button
              type="button"
              onClick={runRecompute}
              disabled={recompute.isPending}
              data-testid="compute-concentration"
              className="cv-ring-focus inline-flex items-center gap-1.5 rounded-xl bg-cv-brand px-4 py-2 text-[12px] font-bold text-white shadow-tile transition hover:opacity-90 disabled:opacity-60"
            >
              {recompute.isPending ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} strokeWidth={2.4} />}
              Compute now
            </button>
          ) : null}
          {recomputeError ? (
            <p className="mt-2 text-[12px] font-medium text-rose-600" data-testid="concentration-error">
              {recomputeError}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
            <span className="text-[13px] font-semibold text-cv-ink">HHI score</span>
            <StatusBadge
              label={`${c.hhi_score} / ${c.threshold_hhi_score}`}
              tone={c.hhi_score >= c.threshold_hhi_score ? "bad" : "good"}
            />
          </div>
          {c.top_vendor_name ? (
            <div className="flex items-center justify-between rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <span className="text-[13px] font-semibold text-cv-ink">Largest dependency</span>
              <span className="text-[12px] font-medium text-cv-slate">
                {c.top_vendor_name} ({(c.top_vendor_share_basis_points / 100).toFixed(1)}%)
              </span>
            </div>
          ) : null}
          <div className="flex items-center justify-between rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
            <span className="text-[13px] font-semibold text-cv-ink">Critical vendors</span>
            <span className="text-[12px] font-medium text-cv-slate">
              {c.critical_vendor_count} of {c.exposure_count} exposures
            </span>
          </div>
          {c.risk_id ? (
            <p className="text-[11px] font-medium text-cv-blue">
              Linked to a risk register entry — treatment tracked there.
            </p>
          ) : null}
          {c.recomputed_at ? (
            <p className="text-[11px] font-medium text-cv-mist">
              Last computed {new Date(c.recomputed_at).toLocaleString()}
            </p>
          ) : null}
          {recomputeError ? (
            <p className="text-[12px] font-medium text-rose-600" data-testid="concentration-error">
              {recomputeError}
            </p>
          ) : null}
          {c.convention_source_title ? (
            <a
              href={c.convention_source_url ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-cv-mist hover:text-cv-blue"
            >
              <ExternalLink size={11} /> Methodology: {c.convention_source_title}
            </a>
          ) : null}
        </div>
      )}
    </SectionCard>
  );
}
