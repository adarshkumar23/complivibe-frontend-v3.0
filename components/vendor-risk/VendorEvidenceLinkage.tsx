"use client";

import { Share2, ExternalLink } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { VendorRiskData } from "@/lib/hooks/useVendorRisk";

/**
 * Concentration-risk panel from GET /api/v1/vendor-concentration-risk —
 * connects vendor spend concentration to the risk register entry it creates.
 */
export function VendorEvidenceLinkage({ data }: { data: VendorRiskData }) {
  const { concentration } = data;
  const c = concentration.data;

  return (
    <SectionCard title="Concentration Risk" subtitle="Single-vendor dependency exposure (HHI)" icon={Share2} accent="teal">
      {concentration.isLoading ? (
        <SkeletonRows rows={3} />
      ) : concentration.isError ? (
        <ErrorState compact title="Unable to load concentration risk" onRetry={() => concentration.refetch()} />
      ) : !c || c.status === "not_computed" ? (
        <EmptyState
          compact
          icon={Share2}
          title="Not computed yet"
          description="Concentration risk is computed from vendor spend and dependency data once available."
        />
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
