"use client";

import { Globe, FileText, ExternalLink } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeTrustAssets } from "@/lib/api/trust-center-normalizers";
import { normalizeReports } from "@/lib/api/report-normalizers";
import { normalizeAuditPacks } from "@/lib/api/audit-pack-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { TrustCenterData } from "@/lib/hooks/useTrustCenter";

type Row = { id: string; title: string; type: string | null; status: string | null; visibility: string | null; url: string | null; date: string | null };

export function PublishedAssets({ data }: { data: TrustCenterData }) {
  const { assets, reports, auditPacks } = data;
  const assetList = normalizeTrustAssets(assets.data);

  let rows: Row[] = [];
  let fallback = false;

  if (assetList.length > 0) {
    rows = assetList.map((a) => ({ id: a.id, title: a.title, type: a.type, status: a.status, visibility: a.visibility, url: a.url, date: a.createdAt || a.updatedAt }));
  } else {
    const reportRows: Row[] = normalizeReports(reports.data).map((r) => ({ id: `rep-${r.id}`, title: r.title, type: r.type || "Report", status: r.status, visibility: null, url: r.url, date: r.createdAt }));
    const packRows: Row[] = normalizeAuditPacks(auditPacks.data).map((p) => ({ id: `pack-${p.id}`, title: p.title, type: "Audit pack", status: p.status, visibility: null, url: p.url, date: p.createdAt }));
    rows = [...reportRows, ...packRows];
    fallback = rows.length > 0;
  }

  const loading = assets.isLoading;
  const errored = assets.isError && reports.isError && auditPacks.isError;

  return (
    <SectionCard
      title="Published Trust Assets"
      subtitle={fallback ? "From reports & audit packs (no dedicated assets)" : "Documents shared with customers"}
      icon={Globe}
      accent="blue"
      className="h-full"
      action={rows.length > 0 ? <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">{rows.length}</span> : null}
    >
      {loading ? (
        <SkeletonRows rows={5} />
      ) : errored ? (
        <ErrorState title="Unable to load assets" onRetry={() => assets.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState icon={FileText} title="No published assets" description="Reports, audit packs, and trust documents shared publicly will appear here." />
      ) : (
        <ul className="max-h-[440px] space-y-2.5 overflow-y-auto pr-1">
          {rows.slice(0, 12).map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85">
              <div className="flex min-w-0 items-center gap-3">
                <IconTile icon={FileText} accent="blue" size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-cv-ink">{r.title}</p>
                  <p className="truncate text-[12px] text-cv-slate">{[r.type, formatDate(r.date)].filter(Boolean).join(" · ") || "No metadata"}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {r.visibility ? <StatusBadge label={r.visibility} tone="purple" /> : null}
                {r.status ? <StatusBadge label={r.status} tone="info" /> : null}
                {r.url ? (
                  <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex h-7 w-7 items-center justify-center rounded-full text-cv-mist transition hover:bg-white/70 hover:text-cv-blue" aria-label="Open asset">
                    <ExternalLink size={14} />
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
