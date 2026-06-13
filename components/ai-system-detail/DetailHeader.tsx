"use client";

import Link from "next/link";
import { ArrowLeft, BrainCircuit } from "lucide-react";
import { IconTile } from "@/components/ui/IconTile";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { normalizeSystemProfile } from "@/lib/api/ai-system-detail-normalizers";
import type { Accent } from "@/components/ui/accent";
import type { AiSystemDetail } from "@/lib/hooks/useAiSystemDetail";

const riskAccent: Record<string, Accent> = {
  critical: "red",
  high: "red",
  medium: "amber",
  low: "green",
  info: "purple"
};

export function DetailHeader({ data }: { data: AiSystemDetail }) {
  const { detail, dashboard } = data;
  const profile = normalizeSystemProfile(detail.data, dashboard.data);
  const loading = detail.isLoading;
  const meta = [profile.owner, profile.useCase].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/dashboard/ai-systems"
        className="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold text-cv-slate transition hover:text-cv-blue"
      >
        <ArrowLeft size={15} />
        Back to AI Systems
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <IconTile icon={BrainCircuit} accent={profile.hasRisk ? riskAccent[profile.riskLevel] : "purple"} size="lg" />
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">AI Governance Registry</span>
            {loading ? (
              <LoadingSkeleton className="mt-1 h-8 w-56" />
            ) : (
              <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[30px]">
                {profile.name || "AI System"}
              </h1>
            )}
            {!loading && !profile.name ? (
              <p className="text-[12px] text-cv-mist">Name not provided by backend</p>
            ) : meta ? (
              <p className="truncate text-[13px] text-cv-slate">{meta}</p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {profile.hasRisk ? <SeverityBadge severity={profile.riskLevel} /> : null}
          {profile.lifecycleStage ? <StatusBadge label={profile.lifecycleStage} tone="info" /> : null}
        </div>
      </div>
    </div>
  );
}
