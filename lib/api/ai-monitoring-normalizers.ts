export { normalizeTelemetry } from "@/lib/api/ai-system-detail-normalizers";
export type { TelemetrySeries } from "@/lib/api/ai-system-detail-normalizers";
export { isActiveMonitoring } from "@/lib/api/ai-system-normalizers";
import { getNumberFromPaths, getStringFromPaths } from "@/lib/api/normalizers";
import type { TelemetrySeries } from "@/lib/api/ai-system-detail-normalizers";

/** Tone for a reliability/uptime value (0–100). Neutral when absent. */
export function reliabilityTone(value: number | null): "good" | "warn" | "bad" | "neutral" {
  if (value == null) return "neutral";
  if (value >= 95) return "good";
  if (value >= 85) return "warn";
  return "bad";
}

/** Extra reliability signals read only when present on the telemetry payload. */
export type ReliabilitySignals = {
  reliability: number | null;
  unit: string | null;
  status: string | null;
  latency: number | null;
  errorRate: number | null;
};

export function reliabilitySignals(value: unknown, base: TelemetrySeries): ReliabilitySignals {
  return {
    reliability: base.value,
    unit: base.unit,
    status: base.status,
    latency: getNumberFromPaths(value, ["latency", "latency_ms", "p95_latency", "avg_latency"]),
    errorRate: getNumberFromPaths(value, ["error_rate", "errorRate", "errors", "failure_rate"])
  };
}

export function costSignal(value: unknown, base: TelemetrySeries): { value: number | null; unit: string | null } {
  return { value: base.value, unit: base.unit || getStringFromPaths(value, ["currency", "unit"]) };
}
