"use client";

import { ScrollText, FileSearch, Layers, CalendarClock } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { normalizePolicies, isUnderReview, isReviewDue } from "@/lib/api/policy-normalizers";
import type { PoliciesData } from "@/lib/hooks/usePolicies";

export function PolicyKpis({ data }: { data: PoliciesData }) {
  const { policies } = data;
  const list = policies.isSuccess ? normalizePolicies(policies.data) : null;
  const loading = policies.isLoading;

  const tracked = list ? list.length : null;
  // Under review only counts when the backend provides a status field.
  const anyStatus = list ? list.some((p) => p.status) : false;
  const underReview = list && anyStatus ? list.filter(isUnderReview).length : null;
  // Linked to frameworks only counts when at least one policy carries a framework field.
  const anyFramework = list ? list.some((p) => p.framework) : false;
  const linked = list && anyFramework ? list.filter((p) => Boolean(p.framework)).length : null;
  const anyReviewField = list ? list.some((p) => p.nextReview || p.status) : false;
  const reviewsDue = list && anyReviewField ? list.filter(isReviewDue).length : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi label="Policies Tracked" icon={ScrollText} accent="blue" value={tracked} caption={tracked != null ? "in library" : undefined} loading={loading} unavailableHint="Policies unavailable" />
      <RegistryKpi label="Under Review" icon={FileSearch} accent="amber" value={underReview} caption={underReview != null ? "backend-confirmed" : undefined} loading={loading} unavailableHint="No status field" />
      <RegistryKpi label="Linked to Frameworks" icon={Layers} accent="purple" value={linked} caption={linked != null ? "mapped" : undefined} loading={loading} unavailableHint="No framework data" />
      <RegistryKpi label="Reviews Due" icon={CalendarClock} accent="red" value={reviewsDue} caption={reviewsDue != null ? "need re-approval" : undefined} loading={loading} unavailableHint="No review data" />
    </div>
  );
}
