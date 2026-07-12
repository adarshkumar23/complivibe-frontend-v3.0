import type { AiRiskRecommendation } from "@/lib/api/insights";
import type { Accent } from "@/components/ui/accent";

type Tone = "good" | "warn" | "bad" | "info" | "neutral" | "purple" | "teal";

export const PRIORITY_TONE: Record<string, Tone> = {
  critical: "bad",
  high: "warn",
  medium: "info",
  low: "neutral"
};

export const PRIORITY_ACCENT: Record<string, Accent> = {
  critical: "red",
  high: "amber",
  medium: "blue",
  low: "teal"
};

const SOURCE_LABEL: Record<string, string> = {
  monitoring_breach: "a live monitoring threshold breach",
  risk_assessment: "a completed AI risk assessment",
  signal: "an AI risk signal",
  manual: "a manual governance review"
};

const CATEGORY_LABEL: Record<string, string> = {
  technical_control: "Technical control",
  process_control: "Process control",
  documentation: "Documentation",
  monitoring: "Monitoring"
};

export function humanizeLabel(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function categoryLabel(category: string): string {
  return CATEGORY_LABEL[category] ?? humanizeLabel(category);
}

/**
 * Builds the "why this matters, and why it's ranked here" sentence from real backend
 * fields — source_type, priority_weight, action_due_in_days, stale_source, linked_task_count.
 * No fabricated text: every clause traces to a field on the recommendation.
 */
export function buildReason(rec: AiRiskRecommendation): string {
  const parts: string[] = [];

  const source = SOURCE_LABEL[rec.source_type] ?? `a ${rec.source_type.replaceAll("_", " ")} source`;
  parts.push(`Generated from ${source}`);

  if (rec.status === "active") {
    if (rec.action_due_in_days <= 7) {
      parts.push(`due within ${rec.action_due_in_days} day${rec.action_due_in_days === 1 ? "" : "s"} — treat as urgent`);
    } else {
      parts.push(`action window: ${rec.action_due_in_days} days`);
    }
  }

  if (rec.stale_source) {
    parts.push("the underlying source data is stale, so re-verify before acting");
  }

  if (rec.source_updated_after_generation) {
    parts.push("the source has changed since this recommendation was generated");
  }

  if (rec.linked_task_count > 0) {
    parts.push(`${rec.linked_task_count} task${rec.linked_task_count === 1 ? "" : "s"} already linked`);
  }

  return `${parts[0]}; ${parts.slice(1).join("; ")}`.replace(/;\s*$/, "");
}

export function inboxItemTone(priorityScore: number): Tone {
  if (priorityScore >= 135) return "bad";
  if (priorityScore >= 115) return "warn";
  return "info";
}

export const INBOX_TYPE_ACCENT: Record<string, Accent> = {
  overdue_task: "red",
  evidence_request: "amber",
  attestation_pending: "purple",
  approval_request: "blue"
};
