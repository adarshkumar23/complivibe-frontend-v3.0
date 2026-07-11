"use client";

import { Building, Flame, ClockAlert, Share2 } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import type { VendorRiskData } from "@/lib/hooks/useVendorRisk";

export function VendorRiskKpis({ data }: { data: VendorRiskData }) {
  const { summary, vendors, concentration } = data;
  const s = summary.data;

  const criticalHigh = s ? (s.by_risk_tier["critical"] ?? 0) + (s.by_risk_tier["high"] ?? 0) : null;
  const overdue = vendors.isSuccess ? vendors.data.filter((v) => v.has_overdue_assessment).length : null;
  const nthParty = vendors.isSuccess ? vendors.data.filter((v) => v.nth_party_risk_flag).length : null;
  const c = concentration.data;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi
        label="Active Vendors"
        icon={Building}
        accent="blue"
        value={s ? s.active_vendors : null}
        caption={s ? `${s.total_vendors} total · ${s.archived_vendors} archived` : undefined}
        loading={summary.isLoading}
        unavailableHint="Vendor summary unavailable"
      />
      <RegistryKpi
        label="Critical / High Tier"
        icon={Flame}
        accent="red"
        value={criticalHigh}
        caption={
          vendors.isSuccess
            ? `${vendors.data.filter((v) => v.processes_personal_data).length} process personal data`
            : undefined
        }
        loading={summary.isLoading}
        unavailableHint="Vendor summary unavailable"
      />
      <RegistryKpi
        label="Overdue Assessments"
        icon={ClockAlert}
        accent="amber"
        value={overdue}
        caption={overdue != null && overdue > 0 ? "stale reviews hide new vendor risk" : overdue === 0 ? "assessments current" : undefined}
        loading={vendors.isLoading}
        unavailableHint="Vendors unavailable"
      />
      <RegistryKpi
        label="Concentration (HHI)"
        icon={Share2}
        accent="purple"
        value={c && c.status !== "not_computed" ? c.hhi_score : null}
        caption={
          c
            ? c.status === "not_computed"
              ? "not computed yet — run a recompute"
              : c.hhi_score >= c.threshold_hhi_score
                ? `above ${c.threshold_hhi_score} threshold${c.top_vendor_name ? ` — ${c.top_vendor_name} dominates` : ""}`
                : `below ${c.threshold_hhi_score} threshold`
            : undefined
        }
        loading={concentration.isLoading}
        unavailableHint="Concentration risk unavailable"
      />
    </div>
  );
}
