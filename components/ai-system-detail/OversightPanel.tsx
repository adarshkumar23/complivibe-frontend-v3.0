"use client";

import { UserCheck, ClipboardList } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeOversight } from "@/lib/api/ai-system-detail-normalizers";
import type { AiSystemDetail } from "@/lib/hooks/useAiSystemDetail";

function tone(status: string | null): "good" | "warn" | "bad" | "neutral" {
  const s = (status || "").toLowerCase();
  if (["met", "approved", "compliant", "complete", "pass"].some((x) => s.includes(x))) return "good";
  if (["pending", "review", "in progress"].some((x) => s.includes(x))) return "warn";
  if (["required", "missing", "fail", "breach"].some((x) => s.includes(x))) return "bad";
  return "neutral";
}

export function OversightPanel({ data }: { data: AiSystemDetail }) {
  const { oversight } = data;
  const items = normalizeOversight(oversight.data);

  return (
    <SectionCard title="Oversight Requirements" subtitle="Human review & approval controls" icon={UserCheck} accent="teal" className="h-full">
      {oversight.isLoading ? (
        <SkeletonRows rows={4} />
      ) : oversight.isError ? (
        <ErrorState title="Unable to load oversight" onRetry={() => oversight.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No oversight controls"
          description="Human review requirements and approval controls for this system will appear here."
        />
      ) : (
        <ul className="space-y-2.5">
          {items.slice(0, 6).map((o) => (
            <li key={o.id} className="rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-semibold text-cv-ink">{o.title}</p>
                {o.status ? <StatusBadge label={o.status} tone={tone(o.status)} /> : null}
              </div>
              {o.description ? <p className="mt-1 line-clamp-2 text-[11px] text-cv-slate">{o.description}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
