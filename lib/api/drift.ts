import { getAiSystems } from "@/lib/api/ai-systems";
import { getDriftTelemetry } from "@/lib/api/ai-system-detail";

/** Drift Detection reuses confirmed AI-system + per-system drift telemetry endpoints. No new paths. */
export { getAiSystems, getDriftTelemetry };
