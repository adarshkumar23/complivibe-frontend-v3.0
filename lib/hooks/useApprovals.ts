"use client";

import { useQuery } from "@tanstack/react-query";
import { getApprovals } from "@/lib/api/approvals";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn });
}

export function useApprovals() {
  const approvals = useEndpoint("approvals", getApprovals);
  return { approvals };
}

export type ApprovalsData = ReturnType<typeof useApprovals>;
