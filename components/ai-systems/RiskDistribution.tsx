"use client";

import { PieChart, ShieldHalf } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { DonutChart } from "@/components/charts/DonutChart";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { normalizeAiSystems, riskDistribution } from "@/lib/api/ai-system-normalizers";
import type { AiSystemsData } from "@/lib/hooks/useAiSystems";

export function RiskDistribution({ data }: { data: AiSystemsData }) {
  const { systems } = data;
  const list = normalizeAiSystems(systems.data);
  const buckets = riskDistribution(list);

  return (
    <SectionCard title="Risk Distribution" subtitle="Systems by risk level" icon={PieChart} accent="red">
      {systems.isLoading ? (
        <LoadingSkeleton className="mx-auto h-36 w-full" />
      ) : systems.isError ? (
        <ErrorState compact title="Unable to load systems" onRetry={() => systems.refetch()} />
      ) : buckets.length === 0 ? (
        <EmptyState
          compact
          icon={ShieldHalf}
          title="No risk data"
          description="Risk levels will be charted here once systems report a risk rating."
        />
      ) : (
        <DonutChart segments={buckets} size={130} centerSub="systems" />
      )}
    </SectionCard>
  );
}
