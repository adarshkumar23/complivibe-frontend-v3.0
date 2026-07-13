"use client";

import { useQuery } from "@tanstack/react-query";
import { getWebhookEndpoints } from "@/lib/api/webhooks";

export function useWebhooks() {
  const endpoints = useQuery({ queryKey: ["webhook-endpoints"], queryFn: getWebhookEndpoints });
  return { endpoints };
}

export type WebhooksData = ReturnType<typeof useWebhooks>;
