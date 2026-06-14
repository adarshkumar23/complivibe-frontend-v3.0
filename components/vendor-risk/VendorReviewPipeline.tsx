"use client";

import { GitBranch, Clock, Loader, CheckCircle2, Ban, FileWarning, type LucideIcon } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeVendors, vendorPipeline } from "@/lib/api/vendor-risk-normalizers";
import type { Accent } from "@/components/ui/accent";
import type { VendorRiskData } from "@/lib/hooks/useVendorRisk";

export function VendorReviewPipeline({ data }: { data: VendorRiskData }) {
  const { vendors } = data;
  const pipeline = vendorPipeline(normalizeVendors(vendors.data));

  const stages: { key: keyof NonNullable<typeof pipeline>; label: string; icon: LucideIcon; accent: Accent }[] = [
    { key: "pendingReview", label: "Pending review", icon: Clock, accent: "blue" },
    { key: "inReview", label: "In review", icon: Loader, accent: "amber" },
    { key: "approved", label: "Approved", icon: CheckCircle2, accent: "green" },
    { key: "blocked", label: "Blocked", icon: Ban, accent: "red" },
    { key: "needsEvidence", label: "Needs evidence", icon: FileWarning, accent: "purple" }
  ];

  return (
    <SectionCard title="Review Pipeline" subtitle="Vendor review stages from backend status" icon={GitBranch} accent="teal" className="h-full">
      {vendors.isLoading ? (
        <SkeletonRows rows={4} />
      ) : vendors.isError ? (
        <ErrorState compact title="Pipeline unavailable" onRetry={() => vendors.refetch()} />
      ) : pipeline == null ? (
        <EmptyState compact icon={GitBranch} title="Pipeline unavailable" description="No vendor returned a review status, so pipeline stages cannot be shown." />
      ) : (
        <ul className="space-y-2.5">
          {stages.map((s) => (
            <li key={s.key} className="flex items-center justify-between gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
              <div className="flex items-center gap-3">
                <IconTile icon={s.icon} accent={s.accent} size="sm" />
                <span className="text-[13px] font-semibold text-cv-ink">{s.label}</span>
              </div>
              <span className="text-[18px] font-extrabold leading-none text-cv-ink">{pipeline[s.key]}</span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
