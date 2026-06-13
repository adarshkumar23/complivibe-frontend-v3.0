"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAiSystemDetail,
  getAiSystemDashboard,
  getModelCard,
  getFactsheets,
  getSystemEvidence,
  getViolations,
  getTestingSummary,
  getLifecycleHistory,
  getOversight,
  getCostTelemetry,
  getDriftTelemetry,
  getReliabilityTelemetry
} from "@/lib/api/ai-system-detail";

export function useAiSystemDetail(id: string | null) {
  const enabled = Boolean(id);
  const sid = id as string;

  const detail = useQuery({ queryKey: ["ai-system", id, "detail"], queryFn: () => getAiSystemDetail(sid), enabled });
  const dashboard = useQuery({ queryKey: ["ai-system", id, "dashboard"], queryFn: () => getAiSystemDashboard(sid), enabled });
  const modelCard = useQuery({ queryKey: ["ai-system", id, "model-card"], queryFn: () => getModelCard(sid), enabled });
  const factsheets = useQuery({ queryKey: ["ai-system", id, "factsheets"], queryFn: () => getFactsheets(sid), enabled });
  const evidence = useQuery({ queryKey: ["ai-system", id, "evidence"], queryFn: () => getSystemEvidence(sid), enabled });
  const violations = useQuery({ queryKey: ["ai-system", id, "violations"], queryFn: () => getViolations(sid), enabled });
  const testing = useQuery({ queryKey: ["ai-system", id, "testing"], queryFn: () => getTestingSummary(sid), enabled });
  const lifecycle = useQuery({ queryKey: ["ai-system", id, "lifecycle"], queryFn: () => getLifecycleHistory(sid), enabled });
  const oversight = useQuery({ queryKey: ["ai-system", id, "oversight"], queryFn: () => getOversight(sid), enabled });
  const cost = useQuery({ queryKey: ["ai-system", id, "cost"], queryFn: () => getCostTelemetry(sid), enabled });
  const drift = useQuery({ queryKey: ["ai-system", id, "drift"], queryFn: () => getDriftTelemetry(sid), enabled });
  const reliability = useQuery({
    queryKey: ["ai-system", id, "reliability"],
    queryFn: () => getReliabilityTelemetry(sid),
    enabled
  });

  return {
    detail,
    dashboard,
    modelCard,
    factsheets,
    evidence,
    violations,
    testing,
    lifecycle,
    oversight,
    cost,
    drift,
    reliability
  };
}

export type AiSystemDetail = ReturnType<typeof useAiSystemDetail>;
