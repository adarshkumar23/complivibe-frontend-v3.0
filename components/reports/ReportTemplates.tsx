"use client";

import { LayoutTemplate } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import type { ReportsData } from "@/lib/hooks/useReports";

/** Regulatory report types from GET /api/v1/reports/regulatory/available-types. */
export function ReportTemplates({ data }: { data: ReportsData }) {
  const { regulatoryTypes } = data;
  const list = regulatoryTypes.data?.report_types ?? [];

  return (
    <SectionCard title="Regulatory Report Types" subtitle="Backend-supported regulatory outputs" icon={LayoutTemplate} accent="purple">
      {regulatoryTypes.isLoading ? (
        <SkeletonRows rows={4} />
      ) : regulatoryTypes.isError ? (
        <ErrorState compact title="Unable to load report types" onRetry={() => regulatoryTypes.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState compact icon={LayoutTemplate} title="No regulatory types" description="Available regulatory reports will list here." />
      ) : (
        <ul className="space-y-2.5">
          {list.map((t) => (
            <li key={t.report_type} className="rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <p className="text-[13px] font-semibold text-cv-ink">{t.report_type.replaceAll("_", " ")}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-cv-slate">{t.description}</p>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
