"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAutopilotSummary,
  getExecutionIntentsSummary,
  getExecutionApprovalsSummary,
  getCandidateActionsSummary,
  getOverridesSummary
} from "@/lib/api/automation";

export function useAutopilot() {
  const summary = useQuery({ queryKey: ["autopilot-summary"], queryFn: getAutopilotSummary });
  const intents = useQuery({ queryKey: ["autopilot-intents"], queryFn: getExecutionIntentsSummary });
  const approvals = useQuery({ queryKey: ["autopilot-approvals"], queryFn: getExecutionApprovalsSummary });
  const candidates = useQuery({ queryKey: ["autopilot-candidates"], queryFn: getCandidateActionsSummary });
  const overrides = useQuery({ queryKey: ["gov-overrides"], queryFn: getOverridesSummary });

  return { summary, intents, approvals, candidates, overrides };
}

export type AutopilotData = ReturnType<typeof useAutopilot>;
