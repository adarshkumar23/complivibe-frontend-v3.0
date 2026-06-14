"use client";

import { SlidersHorizontal } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeDataPreferences } from "@/lib/api/settings-normalizers";
import type { SettingsData } from "@/lib/hooks/useSettings";

function Tile({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl bg-white/55 px-3.5 py-3 ring-1 ring-white/60">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-cv-mist">{label}</p>
      <p className={`mt-0.5 text-[14px] capitalize ${value ? "font-semibold text-cv-ink" : "text-cv-mist"}`}>{value || "Unavailable"}</p>
    </div>
  );
}

export function DataPreferences({ data }: { data: SettingsData }) {
  const { settings } = data;
  const p = normalizeDataPreferences(settings.data);

  return (
    <SectionCard title="Data & Compliance Preferences" subtitle="Defaults for evidence, reports & review" icon={SlidersHorizontal} accent="teal">
      {settings.isLoading ? (
        <SkeletonRows rows={3} />
      ) : !p.hasAny ? (
        <EmptyState icon={SlidersHorizontal} title="No data preferences" description="Default framework, retention, freshness, and review settings will appear here once returned." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Tile label="Default framework" value={p.defaultFramework} />
          <Tile label="Data retention" value={p.dataRetention} />
          <Tile label="Evidence freshness" value={p.evidenceFreshness} />
          <Tile label="Report export format" value={p.reportFormat} />
          <Tile label="Audit review mode" value={p.auditReviewMode} />
          <div className="rounded-xl bg-white/55 px-3.5 py-3 ring-1 ring-white/60">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-cv-mist">Human review required</p>
            <div className="mt-1.5">
              {p.humanReviewRequired == null ? (
                <span className="text-[14px] text-cv-mist">Unavailable</span>
              ) : (
                <StatusBadge label={p.humanReviewRequired ? "Required" : "Optional"} tone={p.humanReviewRequired ? "good" : "neutral"} />
              )}
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
