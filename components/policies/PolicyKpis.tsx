"use client";

import { ScrollText, CheckCircle2, Hourglass, CalendarClock } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import type { PoliciesData } from "@/lib/hooks/usePolicies";

export function PolicyKpis({ data }: { data: PoliciesData }) {
  const { summary, policies } = data;
  const s = summary.data;

  const approved = s ? (s.by_status["approved"] ?? 0) : null;
  const inReview = s ? (s.by_status["under_review"] ?? 0) + (s.by_status["draft"] ?? 0) : null;

  // Review-due within 30 days, computed from real review_due_date values.
  const dueSoon = policies.isSuccess
    ? policies.data.filter((p) => {
        if (!p.review_due_date) return false;
        const days = Math.ceil((new Date(p.review_due_date).getTime() - Date.now()) / 86400000);
        return days <= 30;
      }).length
    : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi
        label="Total Policies"
        icon={ScrollText}
        accent="blue"
        value={s ? s.total_policies : null}
        caption={s ? `${Object.keys(s.by_policy_type).length} policy types` : undefined}
        loading={summary.isLoading}
        unavailableHint="Policy summary unavailable"
      />
      <RegistryKpi
        label="Approved"
        icon={CheckCircle2}
        accent="green"
        value={approved}
        caption={s && s.total_policies > 0 ? `${Math.round(((approved ?? 0) / s.total_policies) * 100)}% of library` : undefined}
        loading={summary.isLoading}
        unavailableHint="Policy summary unavailable"
      />
      <RegistryKpi
        label="Draft / In Review"
        icon={Hourglass}
        accent="amber"
        value={inReview}
        caption={inReview != null && inReview > 0 ? "not yet enforceable" : inReview === 0 ? "library fully approved" : undefined}
        loading={summary.isLoading}
        unavailableHint="Policy summary unavailable"
      />
      <RegistryKpi
        label="Review Due ≤ 30d"
        icon={CalendarClock}
        accent="red"
        value={dueSoon}
        caption={dueSoon != null && dueSoon > 0 ? "schedule reviews now" : dueSoon === 0 ? "no reviews imminent" : undefined}
        loading={policies.isLoading}
        unavailableHint="Policies unavailable"
      />
    </div>
  );
}
