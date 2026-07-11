"use client";

import { FileCheck2, Inbox, TimerOff, ScrollText } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import type { PrivacyData } from "@/lib/hooks/usePrivacy";

export function PrivacyKpis({ data }: { data: PrivacyData }) {
  const { consent, dsrSummary } = data;
  const c = consent.data;
  const d = dsrSummary.data;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi
        label="Active Consents"
        icon={FileCheck2}
        accent="green"
        value={c ? c.active_consents : null}
        caption={
          c
            ? c.active_without_notice_count > 0
              ? `${c.active_without_notice_count} lack a published notice`
              : `${Math.round(c.consent_rate_pct)}% consent rate`
            : undefined
        }
        loading={consent.isLoading}
        unavailableHint="Consent summary unavailable"
      />
      <RegistryKpi
        label="Open Requests"
        icon={Inbox}
        accent="blue"
        value={d ? d.open_count : null}
        caption={d ? `${d.total} lifetime · ${Math.round(d.sla_compliance_rate)}% SLA compliance` : undefined}
        loading={dsrSummary.isLoading}
        unavailableHint="DSR summary unavailable"
      />
      <RegistryKpi
        label="SLA Breached (open)"
        icon={TimerOff}
        accent="red"
        value={d ? d.breached_open_count : null}
        caption={d && d.breached_open_count > 0 ? "regulatory exposure — escalate now" : undefined}
        loading={dsrSummary.isLoading}
        unavailableHint="DSR summary unavailable"
      />
      <RegistryKpi
        label="Consents Expiring ≤30d"
        icon={ScrollText}
        accent="amber"
        value={c ? c.expiring_soon_30d : null}
        caption={c && c.expiring_soon_30d > 0 ? "plan re-consent campaigns" : undefined}
        loading={consent.isLoading}
        unavailableHint="Consent summary unavailable"
      />
    </div>
  );
}
