"use client";

import { SearchCheck, CalendarPlus } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { formatDate } from "@/lib/utils/format";
import type { AuditPackData } from "@/lib/hooks/useAuditPack";

/** Audit engagements from GET /api/v1/compliance/audit-engagements. */
export function AuditPackLibrary({ data }: { data: AuditPackData }) {
  const { engagements } = data;
  const list = engagements.data ?? [];

  return (
    <SectionCard
      title="Audit Engagements"
      subtitle="Internal and external audits in flight"
      icon={SearchCheck}
      accent="blue"
      className="h-full"
      action={
        engagements.isSuccess ? (
          <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
            {list.length} engagements
          </span>
        ) : null
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
          {list.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-3 rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70">
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
              {e.status ? <StatusBadge label={String(e.status).replaceAll("_", " ")} tone="info" /> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
