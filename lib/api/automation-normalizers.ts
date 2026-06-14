import {
  getStringFromPaths,
  getNumberFromPaths,
  getDateFromPaths,
  getArrayFromPaths,
  normalizeList
} from "@/lib/api/normalizers";

/** Count of records in any list-shaped payload (real array length). */
export function recordCount(value: unknown, listExtra: string[] = []): number {
  return getArrayFromPaths(value, ["", "data", "result", "items", "results", "data.items", ...listExtra]).length;
}

/**
 * Automation rule, normalized from /api/v1/automation/rules (or /api/v1/automation).
 * Every business field is null/absent unless the backend returns it — never fabricated.
 */
export type AutomationRule = {
  id: string;
  rawId: string | null;
  name: string;
  triggerType: string | null;
  actionType: string | null;
  status: string | null;
  owner: string | null;
  lastRun: string | null;
  nextRun: string | null;
  lastResult: string | null;
  linkedResource: string | null;
};

const RULE_PATHS = ["", "data", "result", "items", "results", "data.items", "rules", "automations", "automation", "records"];

export function normalizeAutomationRules(value: unknown): AutomationRule[] {
  return normalizeList(value, RULE_PATHS).map((entry, index) => {
    const rawId = getStringFromPaths(entry, ["id", "uuid", "rule_id", "automation_id"]);
    return {
      id: rawId || `automation-${index}`,
      rawId,
      name: getStringFromPaths(entry, ["name", "title", "rule_name", "automation_name", "description"]) || "Untitled automation",
      triggerType: getStringFromPaths(entry, ["trigger_type", "trigger", "event", "on", "schedule_type"]),
      actionType: getStringFromPaths(entry, ["action_type", "action", "task", "operation", "effect"]),
      status: getStringFromPaths(entry, ["status", "state", "enabled", "active"]),
      owner: getStringFromPaths(entry, ["owner", "created_by", "owner_name", "team"]),
      lastRun: getDateFromPaths(entry, ["last_run", "last_run_at", "last_executed", "last_triggered_at", "updated_at"]),
      nextRun: getDateFromPaths(entry, ["next_run", "next_run_at", "scheduled_at", "next_execution"]),
      lastResult: getStringFromPaths(entry, ["last_result", "result", "last_status", "outcome"]),
      linkedResource: getStringFromPaths(entry, ["resource", "linked_resource", "target", "object", "reference"])
    };
  });
}

const ACTIVE = ["active", "enabled", "on", "running", "live", "true", "scheduled"];
const FAILED = ["fail", "error", "failed", "errored"];
const SUCCESS = ["success", "succeeded", "complete", "completed", "ok", "passed"];

function matches(value: string | null, words: string[]): boolean {
  if (!value) return false;
  const v = value.toLowerCase();
  return words.some((w) => v.includes(w));
}

export function isActive(rule: AutomationRule): boolean {
  return matches(rule.status, ACTIVE);
}
export function lastRunFailed(rule: AutomationRule): boolean {
  return matches(rule.lastResult, FAILED) || matches(rule.status, FAILED);
}

export function statusTone(status: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!status) return "neutral";
  if (matches(status, FAILED)) return "bad";
  if (matches(status, ACTIVE) || matches(status, SUCCESS)) return "good";
  if (/(pending|paused|disabled|queued|idle)/i.test(status)) return "warn";
  return "neutral";
}

export function resultTone(result: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!result) return "neutral";
  if (matches(result, FAILED)) return "bad";
  if (matches(result, SUCCESS)) return "good";
  if (/(partial|warning|retry)/i.test(result)) return "warn";
  return "neutral";
}

/* ----------------------------- Runs ----------------------------- */
export type AutomationRun = {
  id: string;
  name: string | null;
  status: string | null;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  result: string | null;
  error: string | null;
};

export function normalizeAutomationRuns(value: unknown): AutomationRun[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "data.items", "runs", "jobs", "executions", "history", "records"]).map((entry, index) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "run_id", "job_id", "execution_id"]) || `run-${index}`,
    name: getStringFromPaths(entry, ["name", "automation_name", "rule_name", "job_name", "title"]),
    status: getStringFromPaths(entry, ["status", "state", "result", "outcome"]),
    startedAt: getDateFromPaths(entry, ["started_at", "start_time", "created_at", "triggered_at", "began_at"]),
    completedAt: getDateFromPaths(entry, ["completed_at", "finished_at", "end_time", "ended_at"]),
    durationMs: getNumberFromPaths(entry, ["duration_ms", "duration", "elapsed_ms", "runtime_ms"]),
    result: getStringFromPaths(entry, ["result", "outcome", "final_status"]),
    error: getStringFromPaths(entry, ["error", "error_message", "failure_reason", "message"])
  }));
}

export function runFailed(run: AutomationRun): boolean {
  return matches(run.result, FAILED) || matches(run.status, FAILED);
}

/** Human duration from ms — only when backend provided it, or derivable from real start/complete times. */
export function runDuration(run: AutomationRun): string | null {
  let ms = run.durationMs;
  if (ms == null && run.startedAt && run.completedAt) {
    const diff = new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime();
    if (Number.isFinite(diff) && diff >= 0) ms = diff;
  }
  if (ms == null) return null;
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60_000)}m`;
}
