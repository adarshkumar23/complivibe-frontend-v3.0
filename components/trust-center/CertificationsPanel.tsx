"use client";

import { Award, ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeCertifications } from "@/lib/api/trust-center-normalizers";
import { normalizeFrameworks } from "@/lib/api/compliance-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { TrustCenterData } from "@/lib/hooks/useTrustCenter";

export function CertificationsPanel({ data }: { data: TrustCenterData }) {
  const { certifications, frameworks } = data;
  const certs = normalizeCertifications(certifications.data);
  const fws = normalizeFrameworks(frameworks.data);

  const loading = certifications.isLoading && frameworks.isLoading;
  const errored = certifications.isError && frameworks.isError;
  const useFallback = certs.length === 0 && fws.length > 0;

  return (
    <SectionCard title="Certifications & Frameworks" subtitle={useFallback ? "Active frameworks" : "Held certifications"} icon={Award} accent="amber" className="h-full">
      {loading ? (
        <SkeletonRows rows={4} />
      ) : errored ? (
        <ErrorState title="Unable to load certifications" onRetry={() => certifications.refetch()} />
      ) : certs.length === 0 && fws.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No certifications or frameworks" description="Certifications and frameworks will appear here once the backend returns them." />
      ) : certs.length > 0 ? (
        <ul className="max-h-[340px] space-y-2.5 overflow-y-auto pr-1">
          {certs.slice(0, 8).map((c) => (
            <li key={c.id} className="rounded-2xl bg-white/55 p-3.5 ring-1 ring-white/70">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-semibold leading-snug text-cv-ink">{c.name}</p>
                {c.status ? <StatusBadge label={c.status} tone="good" /> : null}
              </div>
              <p className="mt-0.5 text-[11px] text-cv-slate">
                {[c.framework, c.issueDate ? `Issued ${formatDate(c.issueDate)}` : null, c.expiryDate ? `Expires ${formatDate(c.expiryDate)}` : null]
                  .filter(Boolean)
                  .join(" · ") || "No dates"}
              </p>
              {c.evidenceCount != null ? <p className="mt-1 text-[11px] font-medium text-cv-mist">{c.evidenceCount} evidence mapped</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="max-h-[340px] space-y-2.5 overflow-y-auto pr-1">
          {fws.slice(0, 8).map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <p className="truncate text-[13px] font-semibold text-cv-ink">{f.name}</p>
              {f.coverage != null ? <StatusBadge label={`${Math.round(f.coverage)}%`} tone="info" /> : f.status ? <StatusBadge label={f.status} tone="neutral" /> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
