"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { probeCopilot, sendCopilotMessage } from "@/lib/api/copilot";
import { normalizeCopilotResponse, type CopilotSource } from "@/lib/api/copilot-normalizers";
import { getCountFromPayload } from "@/lib/api/normalizers";
import { getProactiveInsights, getPredictiveAlerts, getRegulatoryDeadlines } from "@/lib/api/command";
import { getRisks } from "@/lib/api/risks";
import { getApprovals } from "@/lib/api/approvals";
import { getAssuranceCases } from "@/lib/api/assurance";

export type CopilotMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: CopilotSource[];
  /** assistant bubble that is a clean state note (no fabricated answer) */
  note?: boolean;
};

export type CopilotContextCard = {
  id: string;
  label: string;
  count: number | null;
  status: "loading" | "available" | "unavailable";
  href: string;
};

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>, enabled: boolean, retry: boolean | number = 1) {
  return useQuery({ queryKey: [key], queryFn: fn, retry, staleTime: 300_000, enabled });
}

/**
 * @param enabled when false, no Copilot request runs (probe or context). The drawer passes its
 * open state so the availability probe and context fetches only fire when the user opens Copilot —
 * keeping the console clean across the rest of the app.
 */
export function useCopilot(context?: Record<string, unknown>, enabled = true) {
  const availability = useQuery({
    queryKey: ["copilot-availability"],
    queryFn: probeCopilot,
    retry: false,
    staleTime: Infinity,
    enabled
  });

  const [messages, setMessages] = useState<CopilotMessage[]>([]);

  const insights = useEndpoint("proactive-insights", getProactiveInsights, enabled);
  const alerts = useEndpoint("predictive-alerts", getPredictiveAlerts, enabled);
  const risks = useEndpoint("risks", getRisks, enabled);
  const deadlines = useEndpoint("regulatory-deadlines", getRegulatoryDeadlines, enabled);
  const approvals = useEndpoint("approvals", getApprovals, enabled, false);
  const assurance = useEndpoint("assurance-cases", getAssuranceCases, enabled, false);

  const mutation = useMutation({
    mutationFn: (message: string) => {
      const endpoint = availability.data?.endpoint;
      if (!endpoint) throw new Error("Copilot backend unavailable");
      return sendCopilotMessage({ endpoint, message, context });
    },
    onSuccess: (data) => {
      const { answer, sources } = normalizeCopilotResponse(data);
      setMessages((prev) => [
        ...prev,
        answer !== null
          ? { id: `a-${Date.now()}`, role: "assistant", content: answer, sources }
          : {
              id: `a-${Date.now()}`,
              role: "assistant",
              content: "No answer was returned by the backend.",
              note: true
            }
      ]);
    }
  });

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: trimmed }]);
      mutation.mutate(trimmed);
    },
    [mutation]
  );

  const cardOf = (id: string, label: string, href: string, q: { isLoading: boolean; isError: boolean; data: unknown }): CopilotContextCard => ({
    id,
    label,
    href,
    status: q.isLoading ? "loading" : q.isError ? "unavailable" : "available",
    count: q.isError ? null : getCountFromPayload(q.data)
  });

  const contextCards: CopilotContextCard[] = [
    cardOf("insights", "Proactive insights", "/dashboard/insights", insights),
    cardOf("alerts", "Predictive alerts", "/dashboard/alerts", alerts),
    cardOf("risks", "Open risks", "/dashboard/risks", risks),
    cardOf("deadlines", "Regulatory deadlines", "/dashboard/regulatory", deadlines),
    cardOf("approvals", "Approvals", "/dashboard/approvals", approvals),
    cardOf("assurance", "Assurance cases", "/dashboard/assurance", assurance)
  ];

  // available only when the probe positively confirmed a backend endpoint
  const isUnavailable = availability.isSuccess ? availability.data.available === false : !availability.isLoading;

  return {
    isCheckingBackend: availability.isLoading,
    isUnavailable,
    messages,
    send,
    isSending: mutation.isPending,
    sendError: mutation.isError,
    contextCards
  };
}

export type CopilotState = ReturnType<typeof useCopilot>;
