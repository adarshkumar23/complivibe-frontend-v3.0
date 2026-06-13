"use client";

import { FileBarChart, Download } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeReports } from "@/lib/api/report-normalizers";
import { normalizeAuditPacks } from "@/lib/api/audit-pack-normalizers";
import type { TrustCenterData } from "@/lib/hooks/useTrustCenter";

type Row = { id: string; title: string; status: string | null; framework: string | null; url: string | null };

export function PublicReports({ data }: { data: TrustCenterData }) {
  const { reports, auditPacks } = data;
  const rows: Row[] = [
    ...normalizeReports(reports.data).map((r) => ({ id: `r-${r.id}`, title: r.title, status: r.status, framework: r.framework, url: r.url })),
    ...normalizeAuditPacks(auditPacks.data).map((p) => ({ id: `p-${p.id}`, title: p.title, status: p.status, framework: p.framework, url: p.url }))
  ];

  const loading = reports.isLoading && auditPacks.isLoading;
  const errored = reports.isError && auditPacks.isError;

  return (
    <SectionCard title="Public Reports" subtitle="Shareable reports & audit packs" icon={FileBarChart} accent="cyan" className="h-full">
      {loading ? (
        <SkeletonRows rows={4} />
      ) : errored ? (
        <ErrorState title="Unable to load reports" onRetry={() => reports.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState icon={FileBarChart} title="No public reports" description="Reports and audit packs available to share will appear here." />
      ) : (
        <ul className="max-h-[340px] space-y-2.5 overflow-y-auto pr-1">
          {rows.slice(0, 8).map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{r.title}</p>
                {r.framework ? <p className="truncate text-[11px] text-cv-slate">{r.framework}</p> : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {r.status ? <StatusBadge label={r.status} tone="info" /> : null}
                {r.url ? (
                  <a href={r.url} target="_blank" rel="noreferrer" className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-3 py-1.5 text-[11px] font-bold text-white shadow-button transition hover:-translate-y-0.5">
                    <Download size={13} /> Export
                  </a>
                ) : (
                  <span className="text-[11px] font-medium text-cv-mist">No export link</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
