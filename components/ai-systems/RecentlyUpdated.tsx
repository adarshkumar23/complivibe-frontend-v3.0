"use client";

import { History, Cpu } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { formatRelativeTime } from "@/lib/utils/format";
import { normalizeAiSystems } from "@/lib/api/ai-system-normalizers";
import type { AiSystemsData } from "@/lib/hooks/useAiSystems";

export function RecentlyUpdated({ data }: { data: AiSystemsData }) {
  const { systems } = data;
  const list = normalizeAiSystems(systems.data);
  const dated = list
    .filter((s) => s.lastAssessed)
    .sort((a, b) => new Date(b.lastAssessed as string).getTime() - new Date(a.lastAssessed as string).getTime())
    .slice(0, 5);

  return (
    <SectionCard title="Recently Updated Systems" subtitle="Latest assessments & changes" icon={History} accent="teal">
      {systems.isLoading ? (
        <SkeletonRows rows={4} />
      ) : systems.isError ? (
        <ErrorState compact title="Unable to load systems" onRetry={() => systems.refetch()} />
      ) : dated.length === 0 ? (
        <EmptyState
          compact
          icon={Cpu}
          title="No assessment dates"
          description="Systems will appear here once they report an assessment or update timestamp."
        />
      ) : (
        <ul className="space-y-2.5">
          {dated.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{s.name}</p>
                <p className="text-[11px] text-cv-mist">{formatRelativeTime(s.lastAssessed)}</p>
              </div>
              {s.hasRisk ? <SeverityBadge severity={s.riskLevel} /> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
