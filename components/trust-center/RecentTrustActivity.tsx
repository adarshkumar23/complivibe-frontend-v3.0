"use client";

import { History, Activity } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeTrustAssets, normalizeCertifications, trustActivity } from "@/lib/api/trust-center-normalizers";
import { normalizeReports } from "@/lib/api/report-normalizers";
import { normalizeAuditPacks } from "@/lib/api/audit-pack-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { TrustCenterData } from "@/lib/hooks/useTrustCenter";

export function RecentTrustActivity({ data }: { data: TrustCenterData }) {
  const { assets, reports, auditPacks, certifications } = data;

  const events = trustActivity([
    { label: "Asset published", items: normalizeTrustAssets(assets.data).map((a) => ({ id: a.id, title: a.title, ts: a.updatedAt || a.createdAt })) },
    { label: "Report", items: normalizeReports(reports.data).map((r) => ({ id: r.id, title: r.title, ts: r.updatedAt || r.createdAt })) },
    { label: "Audit pack", items: normalizeAuditPacks(auditPacks.data).map((p) => ({ id: p.id, title: p.title, ts: p.updatedAt || p.createdAt })) },
    { label: "Certification", items: normalizeCertifications(certifications.data).map((c) => ({ id: c.id, title: c.name, ts: c.issueDate })) }
  ]).slice(0, 6);

  const loading = assets.isLoading && reports.isLoading;

  return (
    <SectionCard title="Recent Trust Activity" subtitle="Latest published signals" icon={History} accent="cyan" className="h-full">
      {loading ? (
        <SkeletonRows rows={4} />
      ) : events.length === 0 ? (
        <EmptyState compact icon={Activity} title="No dated trust activity" description="Published assets, reports, audit packs, and certifications appear here when they include timestamps." />
      ) : (
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={`${e.id}-${e.timestamp}`} className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cv-brand" />
              <div className="min-w-0">
                <p className="line-clamp-2 text-[13px] font-medium text-cv-ink">
                  <span className="font-semibold">{e.action}:</span> {e.title}
                </p>
                <p className="text-[11px] text-cv-mist">{formatRelativeTime(e.timestamp)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
