"use client";

import { Send, RotateCcw } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeDeliveries, deliveryTone } from "@/lib/api/webhook-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { WebhooksData } from "@/lib/hooks/useWebhooks";

/** No backend retry endpoint exists — disabled, never fakes a result. */
function DisabledRetry() {
  return (
    <button type="button" disabled title="Action endpoint unavailable" className="inline-flex cursor-not-allowed items-center gap-1 rounded-full bg-white/55 px-2 py-1 text-[10px] font-semibold text-cv-mist ring-1 ring-white/60">
      <RotateCcw size={10} /> Retry
    </button>
  );
}

export function DeliveryLogPanel({ data }: { data: WebhooksData }) {
  const { deliveries } = data;
  const list = normalizeDeliveries(deliveries.data);

  return (
    <SectionCard title="Delivery Log" subtitle="Recent webhook delivery attempts" icon={Send} accent="cyan" className="h-full">
      {deliveries.isLoading ? (
        <SkeletonRows rows={5} />
      ) : deliveries.isError ? (
        <EmptyState icon={Send} title="Webhook delivery logs unavailable from backend." description="Delivery attempts, response codes, and retries will appear here once the backend records them." />
      ) : list.length === 0 ? (
        <EmptyState icon={Send} title="No deliveries returned" description="Webhook delivery attempts will appear here once events are dispatched." />
      ) : (
        <ul className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
          {list.slice(0, 14).map((d) => (
            <li key={d.id} className="rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-cv-ink">{d.eventType || "Event"}</p>
                  <p className="truncate font-mono text-[11px] text-cv-slate">{d.destination || "—"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {d.responseCode != null ? <span className="font-mono text-[11px] font-semibold text-cv-slate">{d.responseCode}</span> : null}
                  {d.status ? <StatusBadge label={d.status} tone={deliveryTone(d.status, d.responseCode)} /> : null}
                </div>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-cv-mist">
                <span>{formatRelativeTime(d.timestamp) || "—"}</span>
                {d.retryCount != null ? <span>{d.retryCount} retries</span> : null}
                {d.error ? <span className="truncate text-rose-600">{d.error}</span> : null}
                <DisabledRetry />
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
