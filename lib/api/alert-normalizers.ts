import { normalizeAlerts } from "@/lib/api/normalizers";
import type { NormalizedAlert, Severity } from "@/lib/api/types";

export type FeedAlert = NormalizedAlert & { source: "Proactive" | "Predictive" };

/** Tag each alert with its real source (proactive insights vs predictive alerts). No fabrication. */
export function buildAlertFeed(insights: unknown, predictive: unknown): FeedAlert[] {
  const proactive: FeedAlert[] = normalizeAlerts(insights, undefined).map((a) => ({ ...a, source: "Proactive" }));
  const predicted: FeedAlert[] = normalizeAlerts(undefined, predictive).map((a) => ({ ...a, source: "Predictive" }));
  return [...proactive, ...predicted];
}

const order: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export function sortBySeverity(alerts: FeedAlert[]): FeedAlert[] {
  return [...alerts].sort((a, b) => order[a.severity] - order[b.severity]);
}

export type SeverityBucket = { label: string; value: number; color: string };

const SEV_COLOR: Record<Severity, string> = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#F59E0B",
  low: "#10B981",
  info: "#3B82F6"
};

export function severityBreakdown(alerts: FeedAlert[]): SeverityBucket[] {
  const labels: Record<Severity, string> = { critical: "Critical", high: "High", medium: "Medium", low: "Low", info: "Info" };
  const seq: Severity[] = ["critical", "high", "medium", "low", "info"];
  const counts = new Map<Severity, number>();
  // Only chart alerts the backend actually classified — never bucket unclassified alerts as "Info".
  for (const a of alerts) {
    if (!a.hasSeverity) continue;
    counts.set(a.severity, (counts.get(a.severity) ?? 0) + 1);
  }
  return seq.filter((s) => (counts.get(s) ?? 0) > 0).map((s) => ({ label: labels[s], value: counts.get(s) as number, color: SEV_COLOR[s] }));
}
