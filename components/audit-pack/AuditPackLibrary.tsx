"use client";

import { useState } from "react";
import { SearchCheck, CalendarPlus, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { formatDate } from "@/lib/utils/format";
import type { AuditPackData } from "@/lib/hooks/useAuditPack";
import { EngagementCreateModal } from "@/components/audit-pack/EngagementCreateModal";

function engagementTone(status: string): "good" | "warn" | "bad" | "info" | "neutral" {
  if (status === "closed") return "good";
  if (status === "cancelled") return "neutral";
  if (status === "report_issuance") return "warn";
  return "info";
}

/** Audit engagements from GET /api/v1/compliance/audit-engagements. */
export function AuditPackLibrary({
  data,
  selectedId,
  onSelect
}: {
  data: AuditPackData;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const { engagements } = data;
  const list = engagements.data ?? [];
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <SectionCard
      title="Audit Engagements"
      subtitle="Internal and external audits in flight"
      icon={SearchCheck}
      accent="blue"
      className="h-full"
      action={
        <div className="flex items-center gap-2">
          {engagements.isSuccess ? (
            <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
              {list.length} engagements
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-3 py-1.5 text-[11px] font-bold text-white shadow-button transition hover:-translate-y-0.5"
            data-testid="open-engagement-modal"
          >
            <Plus size={12} />
            New engagement
          </button>
        </div>
      }
    >
      {engagements.isLoading ? (
        <SkeletonRows rows={5} />
      ) : engagements.isError ? (
        <ErrorState title="Unable to load engagements" onRetry={() => engagements.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={CalendarPlus}
          title="No audit engagements"
          description="Create an engagement to scope an audit, track findings, and manage PBC requests."
        />
      ) : (
        <ul className="space-y-2.5">
          {list.map((e) => {
            const selected = selectedId === e.id;
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => onSelect?.(e.id)}
                  data-testid="engagement-row"
                  className={cn(
                    "cv-ring-focus flex w-full items-start justify-between gap-3 rounded-2xl px-3.5 py-3 text-left ring-1 transition",
                    selected ? "bg-cv-brand-soft ring-cv-blue/30" : "bg-white/55 ring-white/70 hover:bg-white/80"
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold leading-snug text-cv-ink">{(e.title as string) ?? "Engagement"}</p>
                    <p className="mt-0.5 text-[11px] text-cv-slate">
                      {[
                        e.audit_type ? String(e.audit_type).replaceAll("_", " ") : null,
                        e.start_date ? `starts ${formatDate(String(e.start_date)) ?? e.start_date}` : null
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  {e.status ? (
                    <StatusBadge
                      className="shrink-0"
                      label={String(e.status).replaceAll("_", " ")}
                      tone={engagementTone(String(e.status))}
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <EngagementCreateModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={(eng) => onSelect?.(eng.id)} />
    </SectionCard>
  );
}
