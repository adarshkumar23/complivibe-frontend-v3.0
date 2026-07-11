"use client";

import { Activity } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import type { IntegrationsData } from "@/lib/hooks/useIntegrations";

/** Channel health: SIEM + email configuration state from their real endpoints. */
export function ConnectorHealthCard({ data }: { data: IntegrationsData }) {
  const { siem, email } = data;

  return (
    <SectionCard title="Channel Health" subtitle="Outbound pipelines and their state" icon={Activity} accent="teal">
      {siem.isLoading || email.isLoading ? (
        <SkeletonRows rows={3} />
      ) : siem.isError && email.isError ? (
        <ErrorState
          compact
          title="Unable to load channel status"
          onRetry={() => {
            siem.refetch();
            email.refetch();
          }}
        />
      ) : (
        <ul className="space-y-2.5">
          <li className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
            <span className="text-[13px] font-semibold text-cv-ink">SIEM export</span>
            <StatusBadge
              label={siem.data ? (siem.data.is_active ? "Active" : "Configured, inactive") : "Not configured"}
              tone={siem.data?.is_active ? "good" : "neutral"}
            />
          </li>
          <li className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
            <span className="text-[13px] font-semibold text-cv-ink">Email delivery</span>
            <StatusBadge
              label={
                email.data
                  ? email.data.is_active
                    ? email.data.use_platform_ses
                      ? "Platform SES"
                      : "Custom SMTP"
                    : "Not active"
                  : "Unavailable"
              }
              tone={email.data?.is_active ? "good" : "neutral"}
            />
          </li>
        </ul>
      )}
    </SectionCard>
  );
}
