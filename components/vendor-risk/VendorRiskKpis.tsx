"use client";

import { Building, ShieldAlert, CalendarClock, FileCheck2 } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { normalizeVendors, isHighRisk, isReviewDue } from "@/lib/api/vendor-risk-normalizers";
import type { VendorRiskData } from "@/lib/hooks/useVendorRisk";

export function VendorRiskKpis({ data }: { data: VendorRiskData }) {
  const { vendors } = data;
  const list = vendors.isSuccess ? normalizeVendors(vendors.data) : null;
  const loading = vendors.isLoading;

  const tracked = list ? list.length : null;
  // High-risk only when the backend actually provides a risk level on at least one vendor.
  const anyRiskLevel = list ? list.some((v) => v.riskLevel) : false;
  const highRisk = list && anyRiskLevel ? list.filter((v) => isHighRisk(v.riskLevel)).length : null;
  // Reviews due only when review dates/status fields exist.
  const anyReviewField = list ? list.some((v) => v.nextReview || v.status) : false;
  const reviewsDue = list && anyReviewField ? list.filter(isReviewDue).length : null;
  const anyEvidence = list ? list.some((v) => v.evidenceCount != null) : false;
  const evidenceLinked = list && anyEvidence ? list.filter((v) => v.evidenceCount != null && v.evidenceCount > 0).length : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi label="Vendors Tracked" icon={Building} accent="blue" value={tracked} caption={tracked != null ? "in registry" : undefined} loading={loading} unavailableHint="Vendors unavailable" />
      <RegistryKpi label="High-Risk Vendors" icon={ShieldAlert} accent="red" value={highRisk} caption={highRisk != null ? "backend-rated" : undefined} loading={loading} unavailableHint="No risk levels" />
      <RegistryKpi label="Reviews Due" icon={CalendarClock} accent="amber" value={reviewsDue} caption={reviewsDue != null ? "need re-assessment" : undefined} loading={loading} unavailableHint="No review data" />
      <RegistryKpi label="Evidence-Linked" icon={FileCheck2} accent="green" value={evidenceLinked} caption={evidenceLinked != null ? "with documents" : undefined} loading={loading} unavailableHint="No evidence data" />
    </div>
  );
}
