"use client";

import { useQuery } from "@tanstack/react-query";
import { getWebhooks, getWebhookDeliveries, getWebhookEvents, getWebhookSummary } from "@/lib/api/webhooks";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn, retry: false });
}

export function useWebhooks() {
  const webhooks = useEndpoint("webhooks", getWebhooks);
  const deliveries = useEndpoint("webhook-deliveries", getWebhookDeliveries);
  const events = useEndpoint("webhook-events", getWebhookEvents);
  const summary = useEndpoint("webhook-summary", getWebhookSummary);

  return { webhooks, deliveries, events, summary };
}

export type WebhooksData = ReturnType<typeof useWebhooks>;
