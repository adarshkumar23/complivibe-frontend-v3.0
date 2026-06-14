"use client";

import { useRouter } from "next/navigation";
import { ListChecks, ArrowUpRight, Info } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { buildDrivers, type DriverSources } from "@/lib/api/score-explainer-normalizers";
import type { ScoreExplainerData } from "@/lib/hooks/useScoreExplainer";

export function DriverList({ data }: { data: ScoreExplainerData }) {
  const { risks, incidents, regulatory, approvals, assurance, questionnaires, trustCenter, vendors } = data;
  const router = useRouter();

  const srcQueries = [risks, incidents, regulatory, approvals, assurance, questionnaires, trustCenter, vendors];
  const anyLoaded = srcQueries.some((s) => s.isSuccess);
  const anyLoading = srcQueries.some((s) => s.isLoading);

  const sources: DriverSources = {};
  if (risks.isSuccess) sources.risks = risks.data;
  if (incidents.isSuccess) sources.incidents = incidents.data;
  if (regulatory.isSuccess) sources.regulatory = regulatory.data;
  if (approvals.isSuccess) sources.approvals = approvals.data;
  if (assurance.isSuccess) sources.assurance = assurance.data;
  if (questionnaires.isSuccess) sources.questionnaires = questionnaires.data;
  if (trustCenter.isSuccess) sources.trustAssets = trustCenter.data;
  if (vendors.isSuccess) sources.vendors = vendors.data;

  const drivers = buildDrivers(sources).sort((a, b) => b.count - a.count);

  return (
    <SectionCard title="Score Drivers" subtitle="Derived from available records" icon={ListChecks} accent="amber" className="h-full">
      {anyLoading && !anyLoaded ? (
        <SkeletonRows rows={5} />
      ) : !anyLoaded ? (
        <EmptyState icon={ListChecks} title="Score drivers unavailable from backend." description="Drivers such as open risks, incidents, and overdue deadlines will appear here once their sources return data." />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-1.5 rounded-xl bg-blue-500/8 px-3 py-2 text-[11px] font-medium text-cv-blue ring-1 ring-blue-500/15">
            <Info size={13} /> Derived from available records — not an official backend formula.
          </p>
          <ul className="space-y-2">
            {drivers.map((d) => (
              <li key={d.key} className="flex items-center justify-between gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
                <div className="flex items-center gap-2.5">
                  <StatusBadge label={String(d.count)} tone={d.tone} />
                  <span className="text-[13px] font-semibold text-cv-ink">{d.label}</span>
                </div>
                <button type="button" onClick={() => router.push(d.route)} className="cv-ring-focus inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-bold text-cv-ink ring-1 ring-white/70 transition hover:bg-white">
                  View <ArrowUpRight size={12} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}
