"use client";

import { Cloud, CloudOff } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { formatRelativeTime } from "@/lib/utils/format";
import type { CloudConnectorsData } from "@/lib/hooks/useCloudConnectors";

const PROVIDER_LABELS: Record<string, string> = {
  aws: "AWS Security Hub",
  azure: "Microsoft Defender for Cloud",
  gcp: "Google Security Command Center",
  github: "GitHub Security Alerts",
  okta: "Okta System Log"
};

/** Registered agent-push connectors from GET /api/v1/cloud-connectors. */
export function ConnectorList({ data }: { data: CloudConnectorsData }) {
  const { connectors } = data;
  const list = connectors.data ?? [];

  return (
    <SectionCard
      title="Cloud Connectors"
      subtitle="Security findings pushed from your cloud accounts"
      icon={Cloud}
      accent="blue"
      className="h-full"
      action={
        connectors.isSuccess ? (
          <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
            {list.length} connectors
          </span>
        ) : null
      }
    >
      {connectors.isLoading ? (
        <SkeletonRows rows={5} />
      ) : connectors.isError ? (
        <ErrorState title="Unable to load connectors" onRetry={() => connectors.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={CloudOff}
          title="No connectors registered"
          description="Register AWS, Azure, GCP, GitHub, or Okta to start ingesting security findings."
        />
      ) : (
        <ul className="space-y-2.5">
          {list.map((c) => (
            <li key={c.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold leading-snug text-cv-ink">{c.display_name}</p>
                  <p className="mt-0.5 text-[11px] text-cv-slate">
                    {[
                      PROVIDER_LABELS[c.connector_type] ?? c.connector_type,
                      c.last_event_received_at
                        ? `last event ${formatRelativeTime(c.last_event_received_at)}`
                        : "no events received yet"
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {c.last_error_message ? (
                    <p className="mt-1 text-[11px] font-medium text-rose-600">
                      {c.consecutive_error_count ?? 0} consecutive errors: {c.last_error_message}
                    </p>
                  ) : null}
                </div>
                <StatusBadge
                  label={c.is_active ? c.status : "disabled"}
                  tone={c.is_active ? (c.status === "active" ? "good" : "info") : "neutral"}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
