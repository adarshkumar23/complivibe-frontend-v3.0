import { getAiSystems, getAiGovernanceSummary } from "@/lib/api/ai-systems";
import { getReliabilityTelemetry, getCostTelemetry } from "@/lib/api/ai-system-detail";
import { getPredictiveAlerts } from "@/lib/api/command";

/** AI Monitoring reuses confirmed AI-system + telemetry + predictive-alert endpoints. No new paths. */
export { getAiSystems, getAiGovernanceSummary, getReliabilityTelemetry, getCostTelemetry, getPredictiveAlerts };
