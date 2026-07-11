"use client";

import { Plug, PlugZap, GitPullRequest, Mail } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import type { IntegrationsData } from "@/lib/hooks/useIntegrations";

export function IntegrationsKpis({ data }: { data: IntegrationsData }) {
  const { catalog, enabled, issueSync, email } = data;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi
        label="Catalog Connectors"
        icon={Plug}
        accent="blue"
        value={catalog.isSuccess ? catalog.data.length : null}
        caption={catalog.isSuccess ? `${new Set(catalog.data.map((c) => c.category)).size} categories` : undefined}
        loading={catalog.isLoading}
        unavailableHint="Catalog unavailable"
      />
      <RegistryKpi
        label="Enabled"
        icon={PlugZap}
        accent="green"
        value={enabled.isSuccess ? enabled.data.length : null}
        caption={enabled.isSuccess && enabled.data.length === 0 ? "no connectors enabled yet" : undefined}
        loading={enabled.isLoading}
        unavailableHint="Enabled connectors unavailable"
      />
      <RegistryKpi
        label="Issue Sync Connections"
        icon={GitPullRequest}
        accent="purple"
        value={issueSync.isSuccess ? issueSync.data.length : null}
        caption={issueSync.isSuccess && issueSync.data.length === 0 ? "connect Jira/ServiceNow to sync issues" : undefined}
        loading={issueSync.isLoading}
        unavailableHint="Issue sync unavailable"
      />
      <RegistryKpi
        label="Email Sends Today"
        icon={Mail}
        accent="teal"
        value={email.data ? email.data.sent_today : null}
        caption={
          email.data
            ? email.data.is_active
              ? `limit ${email.data.daily_send_limit}/day`
              : "email sending not active"
            : undefined
        }
        loading={email.isLoading}
        unavailableHint="Email config unavailable"
      />
    </div>
  );
}
