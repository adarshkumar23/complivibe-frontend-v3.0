"use client";

import { Cpu, ShieldHalf } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeSystems } from "@/lib/api/normalizers";
import type { CommandCenter } from "@/lib/hooks/useCommandCenter";

export function HighRiskSystems({ data }: { data: CommandCenter }) {
  const { aiSystems } = data;
  const all = normalizeSystems(aiSystems.data);
  const highRisk = all.filter((s) => s.riskLevel === "critical" || s.riskLevel === "high");
  const shown = (highRisk.length > 0 ? highRisk : all).slice(0, 4);

  return (
    <SectionCard title="High-Risk Systems" subtitle="AI systems needing review" icon={Cpu} accent="red">
      {aiSystems.isLoading ? (
        <SkeletonRows rows={3} />
      ) : aiSystems.isError ? (
        <ErrorState compact title="Unable to load AI systems" onRetry={() => aiSystems.refetch()} />
      ) : shown.length === 0 ? (
        <EmptyState
          compact
          icon={ShieldHalf}
          title="No systems registered"
          description="Registered AI systems and their risk levels will appear here."
        />
      ) : (
        <ul className="space-y-2.5">
          {shown.map((sys) => (
            <li key={sys.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{sys.name}</p>
                {sys.owner || sys.lifecycleStage ? (
                  <p className="truncate text-[11px] text-cv-slate">{[sys.owner, sys.lifecycleStage].filter(Boolean).join(" · ")}</p>
                ) : null}
              </div>
              <SeverityBadge severity={sys.riskLevel} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
