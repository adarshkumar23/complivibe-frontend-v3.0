"use client";

import { Award, BadgeCheck, FileCheck2, Eye, FolderUp } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeCertifications, statusTone, daysToExpiry } from "@/lib/api/certification-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { CertificationsData } from "@/lib/hooks/useCertifications";

/** Actions are disabled until the backend exposes certification action endpoints — never faked. */
function DisabledAction({ icon: Icon, label }: { icon: typeof Eye; label: string }) {
  return (
    <button
      type="button"
      disabled
      title="Action endpoint not available on this backend yet"
      className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full bg-white/55 px-3 py-1.5 text-[11px] font-semibold text-cv-mist ring-1 ring-white/60"
    >
      <Icon size={12} /> {label}
    </button>
  );
}

export function CertificationsGrid({ data }: { data: CertificationsData }) {
  const { certifications } = data;
  const list = normalizeCertifications(certifications.data);

  return (
    <SectionCard
      title="Certifications"
      subtitle="Frameworks your organization is certified against"
      icon={Award}
      accent="blue"
      action={certifications.isSuccess && list.length > 0 ? <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">{list.length}</span> : null}
    >
      {certifications.isLoading ? (
        <SkeletonRows rows={5} />
      ) : certifications.isError ? (
        <ErrorState title="Unable to load certifications" onRetry={() => certifications.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon={BadgeCheck} title="No certifications returned" description="Certifications, their status, readiness, and renewal dates will appear here once the backend provides them." />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {list.map((c) => {
            const expiry = formatDate(c.expiryDate);
            const days = daysToExpiry(c);
            return (
              <div key={c.id} className="flex flex-col gap-3 rounded-2xl bg-white/55 p-4 ring-1 ring-white/70 transition hover:bg-white/85">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <IconTile icon={Award} accent="amber" size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-cv-ink">{c.name}</p>
                      <p className="truncate text-[11px] text-cv-slate">{[c.framework, c.owner].filter(Boolean).join(" · ") || "No framework / owner"}</p>
                    </div>
                  </div>
                  {c.status ? <StatusBadge label={c.status} tone={statusTone(c.status)} /> : <StatusBadge label="Status unknown" tone="neutral" />}
                </div>

                {c.readiness != null ? (
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="font-medium text-cv-slate">Readiness</span>
                      <span className="font-bold text-cv-ink">{c.readiness}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-400/12">
                      <div className="h-full rounded-full bg-cv-brand" style={{ width: `${Math.max(3, Math.min(100, c.readiness))}%` }} />
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-cv-mist">
                  {expiry ? (
                    <span className={days != null && days <= 90 ? "font-semibold text-amber-600" : ""}>
                      {days != null && days < 0 ? `Expired ${expiry}` : `Renews ${expiry}`}
                    </span>
                  ) : (
                    <span>No renewal date</span>
                  )}
                  {c.evidenceCount != null ? (
                    <span className="inline-flex items-center gap-1 font-medium text-cv-slate">
                      <FileCheck2 size={12} /> {c.evidenceCount} evidence
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2 border-t border-white/50 pt-3">
                  <DisabledAction icon={Eye} label="View details" />
                  <DisabledAction icon={FolderUp} label="Prepare evidence" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
