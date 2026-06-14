"use client";

import { BadgeCheck, ClipboardCheck, FileCheck2, CalendarClock } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { normalizeCertifications, isReady, isExpiringSoon } from "@/lib/api/certification-normalizers";
import type { CertificationsData } from "@/lib/hooks/useCertifications";

export function CertificationKpis({ data }: { data: CertificationsData }) {
  const { certifications } = data;
  const list = certifications.isSuccess ? normalizeCertifications(certifications.data) : null;
  const loading = certifications.isLoading;

  const tracked = list ? list.length : null;
  // Ready/expiring only count when the backend actually provides status/expiry fields.
  const anyStatus = list ? list.some((c) => c.status) : false;
  const ready = list && anyStatus ? list.filter((c) => isReady(c.status)).length : null;
  const evidenceLinked = list ? list.filter((c) => c.evidenceCount != null && c.evidenceCount > 0).length : null;
  const anyExpiry = list ? list.some((c) => c.expiryDate) : false;
  const expiringSoon = list && anyExpiry ? list.filter((c) => isExpiringSoon(c)).length : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi label="Certifications Tracked" icon={BadgeCheck} accent="blue" value={tracked} caption={tracked != null ? "in scope" : undefined} loading={loading} unavailableHint="Certifications unavailable" />
      <RegistryKpi label="Ready for Review" icon={ClipboardCheck} accent="green" value={ready} caption={ready != null ? "backend-confirmed" : undefined} loading={loading} unavailableHint="No status field" />
      <RegistryKpi label="Evidence-Linked" icon={FileCheck2} accent="cyan" value={evidenceLinked} caption={evidenceLinked != null ? "with mapped evidence" : undefined} loading={loading} unavailableHint="Certifications unavailable" />
      <RegistryKpi label="Expiring Soon" icon={CalendarClock} accent="amber" value={expiringSoon} caption={expiringSoon != null ? "within 90 days" : undefined} loading={loading} unavailableHint="No expiry dates" />
    </div>
  );
}
