"use client";

import { useState } from "react";
import { Webhook, WebhookOff, Loader2, TriangleAlert } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { formatRelativeTime } from "@/lib/utils/format";
import { deactivateWebhookEndpoint } from "@/lib/api/webhooks";
import type { WebhooksData } from "@/lib/hooks/useWebhooks";

/** Registered outbound webhook endpoints from GET /api/v1/compliance/webhook-endpoints. */
export function WebhookEndpointList({ data }: { data: WebhooksData }) {
  const { endpoints } = data;
  const list = endpoints.data ?? [];
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDeactivate(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await deactivateWebhookEndpoint(id);
      endpoints.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate endpoint.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <SectionCard
      title="Webhook Endpoints"
      subtitle="Outbound event delivery to your own systems"
      icon={Webhook}
      accent="blue"
      className="h-full"
      action={
        endpoints.isSuccess ? (
          <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
            {list.length} endpoint{list.length === 1 ? "" : "s"}
          </span>
        ) : null
      }
    >
      {endpoints.isLoading ? (
        <SkeletonRows rows={4} />
      ) : endpoints.isError ? (
        <ErrorState title="Unable to load webhook endpoints" onRetry={() => endpoints.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={WebhookOff}
          title="No webhook endpoints registered"
          description="Register an endpoint to receive control failures, critical risks, and other compliance events as they happen."
        />
      ) : (
        <>
          <ul className="space-y-2.5">
            {list.map((w) => (
              <li key={w.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold leading-snug text-cv-ink">{w.name}</p>
                    <p className="mt-0.5 break-all text-[11px] text-cv-slate">{w.url}</p>
                    <p className="mt-1 text-[11px] text-cv-mist">
                      Signing secret: <span className="font-mono">{w.secret}</span>
                    </p>
                    <p className="mt-1 flex flex-wrap gap-1">
                      {w.event_types.map((et) => (
                        <span
                          key={et}
                          className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-semibold text-cv-slate ring-1 ring-white/70"
                        >
                          {et}
                        </span>
                      ))}
                    </p>
                    <p className="mt-1 text-[10px] text-cv-mist">created {formatRelativeTime(w.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <StatusBadge label={w.is_active ? "active" : "deactivated"} tone={w.is_active ? "good" : "neutral"} />
                    {w.is_active ? (
                      <button
                        type="button"
                        onClick={() => handleDeactivate(w.id)}
                        disabled={busyId === w.id}
                        className="cv-ring-focus inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-1 text-[11px] font-bold text-cv-slate ring-1 ring-white/70 transition hover:bg-white hover:text-cv-ink disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busyId === w.id ? <Loader2 size={11} className="animate-spin" /> : null}
                        Deactivate
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {error ? (
            <p className="mt-2 flex items-start gap-1.5 text-[12px] font-medium text-rose-600">
              <TriangleAlert size={13} className="mt-0.5 shrink-0" />
              {error}
            </p>
          ) : null}
        </>
      )}
    </SectionCard>
  );
}
