"use client";

import { TriangleAlert, Flame, ShieldAlert, Cpu, type LucideIcon } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { riskImpact } from "@/lib/api/score-explainer-normalizers";
import type { Accent } from "@/components/ui/accent";
import type { ScoreExplainerData } from "@/lib/hooks/useScoreExplainer";

function Tile({ icon, label, value, accent }: { icon: LucideIcon; label: string; value: number | null; accent: Accent }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
      <IconTile icon={icon} accent={accent} size="sm" />
      <div className="min-w-0">
        <p className={`text-lg font-extrabold leading-none ${value != null ? "text-cv-ink" : "text-cv-mist"}`}>{value != null ? value : "—"}</p>
        <p className="mt-0.5 text-[11px] font-medium text-cv-slate">{label}</p>
      </div>
    </div>
  );
}

export function RiskImpactSection({ data }: { data: ScoreExplainerData }) {
  const { risks } = data;
  const r = risks.isSuccess ? riskImpact(risks.data) : null;

  return (
    <SectionCard title="Risk Impact" subtitle="Open and high-severity risks" icon={TriangleAlert} accent="red" className="h-full">
      {risks.isLoading ? (
        <SkeletonRows rows={3} />
      ) : risks.isError || !r ? (
        <EmptyState icon={TriangleAlert} title="Risk impact unavailable" description="The risks endpoint is not available on this backend yet." />
      ) : r.total === 0 ? (
        <EmptyState icon={TriangleAlert} title="No risk records" description="Risk impact will appear here once the backend returns risks." />
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          <Tile icon={TriangleAlert} label="Total risks" value={r.total} accent="amber" />
          <Tile icon={Flame} label="High / critical" value={r.highCritical} accent="red" />
          <Tile icon={ShieldAlert} label="Open risks" value={r.open} accent="amber" />
          <Tile icon={Cpu} label="Linked AI systems" value={r.linkedSystems} accent="blue" />
        </div>
      )}
    </SectionCard>
  );
}
