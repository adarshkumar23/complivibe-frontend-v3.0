"use client";

import { IdCard } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeSystemProfile } from "@/lib/api/ai-system-detail-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { AiSystemDetail } from "@/lib/hooks/useAiSystemDetail";

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/50 py-2.5 last:border-0">
      <span className="text-[12px] font-semibold text-cv-slate">{label}</span>
      <span className={`text-right text-[13px] ${value ? "font-semibold text-cv-ink" : "text-cv-mist"}`}>
        {value || "Not provided"}
      </span>
    </div>
  );
}

export function SystemProfile({ data }: { data: AiSystemDetail }) {
  const { detail, dashboard } = data;
  const p = normalizeSystemProfile(detail.data, dashboard.data);
  const rows = [
    { label: "Name", value: p.name },
    { label: "Owner", value: p.owner },
    { label: "Use case", value: p.useCase },
    { label: "Model", value: p.model },
    { label: "Vendor", value: p.vendor },
    { label: "Lifecycle stage", value: p.lifecycleStage },
    { label: "Region / jurisdiction", value: p.region },
    { label: "Created", value: formatDate(p.createdAt) },
    { label: "Updated", value: formatDate(p.updatedAt) }
  ];
  const hasAny = rows.some((r) => r.value);

  return (
    <SectionCard title="System Profile" subtitle="Core registry details" icon={IdCard} accent="blue" className="h-full">
      {detail.isLoading ? (
        <SkeletonRows rows={5} />
      ) : detail.isError ? (
        <ErrorState title="Unable to load system" onRetry={() => detail.refetch()} />
      ) : !hasAny ? (
        <EmptyState icon={IdCard} title="No profile details" description="System profile fields will appear here once the backend provides them." />
      ) : (
        <div>
          {rows.map((r) => (
            <Row key={r.label} label={r.label} value={r.value} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
