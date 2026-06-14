"use client";

import { FileCheck2, FolderOpen } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeCertifications } from "@/lib/api/certification-normalizers";
import type { CertificationsData } from "@/lib/hooks/useCertifications";

export function EvidenceRequirements({ data }: { data: CertificationsData }) {
  const { certifications } = data;
  const list = normalizeCertifications(certifications.data);
  // Only certifications for which the backend actually returns a linked-evidence count.
  const mapped = list.filter((c) => c.evidenceCount != null);

  return (
    <SectionCard title="Evidence Requirements" subtitle="Evidence mapped per certification" icon={FileCheck2} accent="green" className="h-full">
      {certifications.isLoading ? (
        <SkeletonRows rows={4} />
      ) : certifications.isError ? (
        <ErrorState compact title="Unable to load evidence mapping" onRetry={() => certifications.refetch()} />
      ) : mapped.length === 0 ? (
        <EmptyState compact icon={FolderOpen} title="Evidence requirements unavailable from backend." description="Per-certification evidence mapping will appear here once the backend returns it." />
      ) : (
        <ul className="max-h-[360px] space-y-2.5 overflow-y-auto pr-1">
          {mapped.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{c.name}</p>
                {c.framework ? <p className="truncate text-[11px] text-cv-slate">{c.framework}</p> : null}
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
                <FileCheck2 size={12} /> {c.evidenceCount}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
