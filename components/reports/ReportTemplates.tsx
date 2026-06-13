"use client";

import { LayoutTemplate } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeReportTemplates } from "@/lib/api/report-normalizers";
import type { ReportsData } from "@/lib/hooks/useReports";

export function ReportTemplates({ data }: { data: ReportsData }) {
  const { templates } = data;
  const list = normalizeReportTemplates(templates.data);

  return (
    <SectionCard title="Report Templates" subtitle="Available report blueprints" icon={LayoutTemplate} accent="cyan" className="h-full">
      {templates.isLoading ? (
        <SkeletonRows rows={4} />
      ) : templates.isError ? (
        <ErrorState title="Unable to load templates" onRetry={() => templates.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon={LayoutTemplate} title="No templates available" description="Report templates will appear here once the backend returns them." />
      ) : (
        <ul className="max-h-[360px] space-y-2.5 overflow-y-auto pr-1">
          {list.slice(0, 8).map((t) => (
            <li key={t.id} className="rounded-2xl bg-white/55 p-3.5 ring-1 ring-white/70">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-semibold leading-snug text-cv-ink">{t.name}</p>
                {t.type ? <span className="shrink-0 rounded-full bg-cv-brand-soft px-2 py-0.5 text-[10px] font-semibold text-cv-blue ring-1 ring-white/60">{t.type}</span> : null}
              </div>
              {t.framework ? <p className="mt-0.5 text-[11px] font-medium text-cv-slate">{t.framework}</p> : null}
              {t.description ? <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-cv-slate">{t.description}</p> : null}
              {t.requiredInputs.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {t.requiredInputs.slice(0, 5).map((inp) => (
                    <span key={inp} className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium text-cv-slate ring-1 ring-slate-200/70">
                      {inp}
                    </span>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
