import { getAiSystems, getAiGovernanceSummary, getGovernanceScore } from "@/lib/api/ai-systems";
import { getTestingSummary, getViolations } from "@/lib/api/ai-system-detail";

/** AI Testing reuses confirmed AI-system + per-system testing endpoints. No new paths. */
export { getAiSystems, getAiGovernanceSummary, getGovernanceScore, getTestingSummary, getViolations };
