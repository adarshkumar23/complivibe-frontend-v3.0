"use client";

import { Webhook, Send, AlertTriangle, ListTree } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { normalizeWebhooks, normalizeDeliveries, normalizeEvents, normalizeWebhookSummary, deliveryTone } from "@/lib/api/webhook-normalizers";
import type { WebhooksData } from "@/lib/hooks/useWebhooks";

export function WebhooksKpis({ data }: { data: WebhooksData }) {
  const { webhooks, deliveries, events, summary } = data;
  const sum = normalizeWebhookSummary(summary.data);

  const hooks = webhooks.isSuccess ? normalizeWebhooks(webhooks.data) : null;
  const anyHookStatus = hooks ? hooks.some((h) => h.status) : false;
  const active = sum.active ?? (hooks && anyHookStatus ? hooks.filter((h) => h.status && /(active|enabled|live|true)/i.test(h.status)).length : null);

  const dels = deliveries.isSuccess ? normalizeDeliveries(deliveries.data) : null;
  const recentDeliveries = sum.deliveries ?? (dels ? dels.length : null);
  const anyDelStatus = dels ? dels.some((d) => d.status || d.responseCode != null) : false;
  const failed = sum.failed ?? (dels && anyDelStatus ? dels.filter((d) => deliveryTone(d.status, d.responseCode) === "bad").length : null);

  const eventList = events.isSuccess ? normalizeEvents(events.data) : null;
  const eventTypes = sum.eventTypes ?? (eventList ? eventList.length : null);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi label="Active Webhooks" icon={Webhook} accent="green" value={active} caption={active != null ? "delivering events" : undefined} loading={webhooks.isLoading || summary.isLoading} unavailableHint="No status field" />
      <RegistryKpi label="Recent Deliveries" icon={Send} accent="blue" value={recentDeliveries} caption={recentDeliveries != null ? "logged" : undefined} loading={deliveries.isLoading || summary.isLoading} unavailableHint="Deliveries unavailable" />
      <RegistryKpi label="Failed Deliveries" icon={AlertTriangle} accent="red" value={failed} caption={failed != null ? "need retry" : undefined} loading={deliveries.isLoading || summary.isLoading} unavailableHint="No delivery status" />
      <RegistryKpi label="Event Types" icon={ListTree} accent="purple" value={eventTypes} caption={eventTypes != null ? "in catalog" : undefined} loading={events.isLoading || summary.isLoading} unavailableHint="Catalog unavailable" />
    </div>
  );
}
