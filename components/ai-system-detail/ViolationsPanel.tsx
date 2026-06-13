"use client";

import { ShieldX, ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeViolations } from "@/lib/api/ai-system-detail-normalizers";
import type { AiSystemDetail } from "@/lib/hooks/useAiSystemDetail";

export function ViolationsPanel({ data }: { data: AiSystemDetail }) {
  const { violations } = data;
  const items = normalizeViolations(violations.data);

  return (
    <SectionCard
      title="Violations & Risks"
      subtitle="Policy breaches needing attention"
      icon={ShieldX}
      accent="red"
      className="h-full"
      action={
        violations.isSuccess && items.length > 0 ? (
          <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold text-rose-600 ring-1 ring-rose-500/20">
            {items.length}
          </span>
        ) : null
      }
    >
      {violations.isLoading ? (
        <SkeletonRows rows={4} />
      ) : violations.isError ? (
        <ErrorState title="Unable to load violations" onRetry={() => violations.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No violations recorded"
          description="Policy and compliance violations for this system will be listed here when detected."
        />
      ) : (
        <ul className="max-h-[340px] space-y-2.5 overflow-y-auto pr-1">
          {items.slice(0, 8).map((v) => (
            <li key={v.id} className="rounded-2xl bg-white/55 p-3.5 ring-1 ring-white/70">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-semibold leading-snug text-cv-ink">{v.title}</p>
                {v.hasSeverity ? <SeverityBadge severity={v.severity} /> : v.status ? <StatusBadge label={v.status} tone="warn" /> : null}
              </div>
              {v.recommendation ? (
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-cv-slate">{v.recommendation}</p>
              ) : null}
              {v.status && v.hasSeverity ? <p className="mt-1.5 text-[11px] font-medium text-cv-mist">{v.status}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
