"use client";

import { Gauge } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { ScoreRing } from "@/components/charts/ScoreRing";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { normalizeCertifications, averageReadiness, isReady } from "@/lib/api/certification-normalizers";
import type { CertificationsData } from "@/lib/hooks/useCertifications";

export function ReadinessPanel({ data }: { data: CertificationsData }) {
  const { certifications } = data;
  const list = normalizeCertifications(certifications.data);

  // Real, backend-derived average across certs that report a readiness value. Null if none do.
  const avg = averageReadiness(list);
  const withReadiness = list.filter((c) => c.readiness != null).length;
  const readyCount = list.some((c) => c.status) ? list.filter((c) => isReady(c.status)).length : null;

  return (
    <SectionCard title="Certification Readiness" subtitle="Average readiness across reported certifications" icon={Gauge} accent="teal" className="h-full">
      {certifications.isLoading ? (
        <LoadingSkeleton className="mx-auto h-36 w-40 rounded-2xl" />
      ) : certifications.isError ? (
        <ErrorState compact title="Unable to load readiness" onRetry={() => certifications.refetch()} />
      ) : avg == null ? (
        <EmptyState compact icon={Gauge} title="Readiness unavailable" description="No certification returned a readiness or progress value from the backend." />
      ) : (
        <div className="flex flex-col items-center gap-4">
          <ScoreRing value={avg} size={130} label="Avg readiness" />
          <div className="grid w-full grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-white/50 px-2 py-2.5 text-center ring-1 ring-white/60">
              <p className="text-lg font-extrabold text-cv-ink">{withReadiness}</p>
              <p className="text-[10px] font-medium text-cv-slate">With readiness data</p>
            </div>
            <div className="rounded-xl bg-white/50 px-2 py-2.5 text-center ring-1 ring-white/60">
              <p className="text-lg font-extrabold text-emerald-600">{readyCount != null ? readyCount : "—"}</p>
              <p className="text-[10px] font-medium text-cv-slate">Ready for review</p>
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
