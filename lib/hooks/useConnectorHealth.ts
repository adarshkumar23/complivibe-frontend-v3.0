"use client";

import { useQuery } from "@tanstack/react-query";
import { getConnectorHealthList, getConnectorHealthSummary } from "@/lib/api/connector-health";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn, retry: false });
}

export function useConnectorHealth() {
  const summary = useEndpoint("connector-health-summary", getConnectorHealthSummary);
  const list = useEndpoint("connector-health-list", getConnectorHealthList);
  return { summary, list };
}

export type ConnectorHealthData = ReturnType<typeof useConnectorHealth>;
