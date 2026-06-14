"use client";

import { ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { ScoreRing } from "@/components/charts/ScoreRing";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { privacyScore, normalizePrivacyReadiness } from "@/lib/api/privacy-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { PrivacyData } from "@/lib/hooks/usePrivacy";

export function PrivacyReadinessPanel({ data }: { data: PrivacyData }) {
  const { summary, overview } = data;
  const score = privacyScore(summary.data, overview.data);
  const r = normalizePrivacyReadiness(summary.data, overview.data);
  const loading = summary.isLoading && overview.isLoading;

  return (
    <SectionCard title="Privacy Readiness" subtitle="DPDP & data-protection posture" icon={ShieldCheck} accent="purple" className="h-full">
      {loading ? (
        <SkeletonRows rows={4} />
      ) : score == null && !r.hasAny ? (
        <EmptyState icon={ShieldCheck} title="Privacy readiness unavailable from backend." description="Readiness score, status, evidence, and obligation coverage will appear here once the backend returns them." />
      ) : (
        <div className="flex flex-col items-center gap-4">
          {score != null ? <ScoreRing value={score} size={130} label="Readiness" /> : null}
          <div className="w-full space-y-1.5">
            <div className="flex items-center justify-between gap-4 border-b border-white/50 py-2">
              <span className="text-[12px] font-semibold text-cv-slate">Status</span>
              {r.status ? <StatusBadge label={r.status} tone="info" /> : <span className="text-[12px] text-cv-mist">Unavailable</span>}
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-white/50 py-2">
              <span className="text-[12px] font-semibold text-cv-slate">Obligation coverage</span>
              <span className={`text-[13px] font-bold ${r.obligationCoverage != null ? "text-cv-ink" : "text-cv-mist"}`}>{r.obligationCoverage != null ? `${Math.round(r.obligationCoverage)}%` : "Unavailable"}</span>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-white/50 py-2">
              <span className="text-[12px] font-semibold text-cv-slate">Linked evidence</span>
              <span className={`text-[13px] font-bold ${r.evidenceCount != null ? "text-cv-ink" : "text-cv-mist"}`}>{r.evidenceCount != null ? r.evidenceCount : "Unavailable"}</span>
            </div>
            <div className="flex items-center justify-between gap-4 py-2">
              <span className="text-[12px] font-semibold text-cv-slate">Next deadline</span>
              <span className={`text-[13px] font-bold ${r.nextDeadline ? "text-cv-ink" : "text-cv-mist"}`}>{r.nextDeadline ? formatDate(r.nextDeadline) : "Unavailable"}</span>
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
